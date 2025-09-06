#import "NetSignal.h"
#import <Network/Network.h>
#import <SystemConfiguration/SystemConfiguration.h>

@interface NetSignal ()
@property (nonatomic, strong) dispatch_queue_t monitorQueue;
@property (nonatomic, strong) nw_path_monitor_t monitor;
@property (nonatomic, assign) BOOL isConnected;
@property (nonatomic, strong) NSString *connectionType;
@property (nonatomic, strong) NSOperationQueue *operationQueue;
@end

@implementation NetSignal

RCT_EXPORT_MODULE()

- (instancetype)init {
    if (self = [super init]) {
        _operationQueue = [[NSOperationQueue alloc] init];
        _operationQueue.maxConcurrentOperationCount = 1;
        _connectionType = @"none";
        _isConnected = NO;
        
        [self setupNetworkMonitor];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

#pragma mark - Network Monitor Setup

- (void)setupNetworkMonitor {
    self.monitorQueue = dispatch_queue_create("com.netsignal.monitor", DISPATCH_QUEUE_SERIAL);
    self.monitor = nw_path_monitor_create();
    
    nw_path_monitor_set_update_handler(self.monitor, ^(nw_path_t path) {
        [self updateConnectionState:path];
    });
    
    nw_path_monitor_start(self.monitor, self.monitorQueue);
}

- (void)updateConnectionState:(nw_path_t)path {
    nw_path_status_t status = nw_path_get_status(path);
    
    self.isConnected = (status == nw_path_status_satisfied);
    
    if (self.isConnected) {
        if (nw_path_uses_interface_type(path, nw_interface_type_wifi)) {
            self.connectionType = @"wifi";
        } else if (nw_path_uses_interface_type(path, nw_interface_type_cellular)) {
            self.connectionType = @"cellular";
        } else if (nw_path_uses_interface_type(path, nw_interface_type_wired)) {
            self.connectionType = @"ethernet";
        } else {
            self.connectionType = @"unknown";
        }
    } else {
        self.connectionType = @"none";
    }
    
    // Emit event
    [self emitConnectionChange];
}

- (void)emitConnectionChange {
    if (self.bridge) {
        [self sendEventWithName:@"connectionChange" 
                           body:@{
                               @"isConnected": @(self.isConnected),
                               @"type": self.connectionType
                           }];
    }
}

#pragma mark - Synchronous Methods (Instant!)

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isConnected) {
    return @(self.isConnected);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getConnectionType) {
    return self.connectionType;
}

#pragma mark - Asynchronous Methods

RCT_EXPORT_METHOD(probe:(NSString *)urlString
                  timeoutMs:(NSInteger)timeoutMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    [self.operationQueue addOperationWithBlock:^{
        NSTimeInterval startTime = [[NSDate date] timeIntervalSince1970] * 1000;
        
        NSURL *url = [NSURL URLWithString:urlString];
        NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
        request.HTTPMethod = @"HEAD";
        request.timeoutInterval = timeoutMs / 1000.0;
        
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        __block NSDictionary *result = nil;
        
        NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request 
            completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
            
            NSTimeInterval responseTime = ([[NSDate date] timeIntervalSince1970] * 1000) - startTime;
            
            if (error) {
                result = @{
                    @"reachable": @NO,
                    @"responseTime": @(-1),
                    @"error": error.localizedDescription
                };
            } else {
                NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
                BOOL reachable = httpResponse.statusCode >= 200 && httpResponse.statusCode < 400;
                
                result = @{
                    @"reachable": @(reachable),
                    @"responseTime": @(responseTime)
                };
            }
            
            dispatch_semaphore_signal(semaphore);
        }];
        
        [task resume];
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
        
        resolve(result);
    }];
}

#pragma mark - Event Emitter

- (NSArray<NSString *> *)supportedEvents {
    return @[@"connectionChange"];
}

RCT_EXPORT_METHOD(addListener:(NSString *)eventName) {
    // Required for RN event system
}

RCT_EXPORT_METHOD(removeListeners:(int)count) {
    // Required for RN event system
}

- (void)invalidate {
    if (self.monitor) {
        nw_path_monitor_cancel(self.monitor);
    }
}

#pragma mark - Turbo Module

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeNetSignalSpecJSI>(params);
}

@end