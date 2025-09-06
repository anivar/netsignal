/**
 * NetSignal iOS Implementation
 * 
 * @author Anivar A Aravind <ping@anivar.net>
 * @copyright 2025 Anivar A Aravind
 * @license MIT
 */


#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "NetSignalSpec.h"

@interface NetSignal : RCTEventEmitter <NativeNetSignalSpec>
#else
@interface NetSignal : RCTEventEmitter <RCTBridgeModule>
#endif

@end