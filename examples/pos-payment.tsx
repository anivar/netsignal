import NetSignal, { useNetworkState } from 'netsignal';
import React from 'react';
import { Alert, Button, Text, View } from 'react-native';

// POS payment system example
class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

async function processPayment(
  amount: number
): Promise<{ success: boolean; transactionId?: string }> {
  // Instant connectivity check (0.3ms)
  if (!NetSignal.isConnected()) {
    throw new PaymentError('No internet connection');
  }

  // Prefer stable connections for payments
  const connectionType = NetSignal.getConnectionType();
  if (connectionType === 'ethernet') {
    console.log('Using stable wired connection for payment');
  } else if (connectionType === 'cellular') {
    console.log('Using cellular connection - may be slower');
  }

  // Verify backup connectivity for reliability
  if (NetSignal.hasMultipleConnections()) {
    console.log('Backup connection available');
  }

  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    success: true,
    transactionId: `TXN_${Date.now()}`,
  };
}

function POSTerminal() {
  const network = useNetworkState();
  const [processing, setProcessing] = React.useState(false);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      const result = await processPayment(99.99);

      Alert.alert('Payment Successful', `Transaction ID: ${result.transactionId}`);
    } catch (error) {
      Alert.alert(
        'Payment Failed',
        error instanceof PaymentError ? error.message : 'Unknown error'
      );
    } finally {
      setProcessing(false);
    }
  };

  const getConnectionStatus = () => {
    if (!network.connected) {
      return { color: 'red', text: 'OFFLINE' };
    }

    if (network.type === 'ethernet') {
      return { color: 'green', text: 'STABLE' };
    }

    if (network.multipleConnections) {
      return { color: 'orange', text: 'BACKUP AVAILABLE' };
    }

    return { color: 'blue', text: 'ONLINE' };
  };

  const status = getConnectionStatus();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>POS Terminal</Text>

      <View style={{ marginVertical: 20 }}>
        <Text style={{ color: status.color, fontWeight: 'bold' }}>Network: {status.text}</Text>
        <Text>Type: {network.type}</Text>
        <Text>Connections: {network.connectionCount}</Text>
      </View>

      <Button
        title={processing ? 'Processing...' : 'Process Payment ($99.99)'}
        onPress={handlePayment}
        disabled={processing || !network.connected}
      />
    </View>
  );
}

export default POSTerminal;
