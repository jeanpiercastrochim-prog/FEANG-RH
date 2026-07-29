import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const OFFLINE_QUEUE_KEY = '@offline_queue';

export interface QueuedTransaction {
  id: string;
  type: 'RECEPCION' | 'DESPACHO' | 'TRASLADO' | 'AUDITORIA';
  payload: any;
  timestamp: number;
}

export const getOfflineQueue = async (): Promise<QueuedTransaction[]> => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline queue', error);
    return [];
  }
};

export const enqueueTransaction = async (transaction: Omit<QueuedTransaction, 'id' | 'timestamp'>) => {
  try {
    const queue = await getOfflineQueue();
    const newTx: QueuedTransaction = {
      ...transaction,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    queue.push(newTx);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return newTx;
  } catch (error) {
    console.error('Error enqueueing transaction', error);
  }
};

export const removeTransaction = async (id: string) => {
  try {
    let queue = await getOfflineQueue();
    queue = queue.filter(tx => tx.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error removing transaction', error);
  }
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const syncOfflineQueue = async (apiUrl: string) => {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { total: 0, synced: 0, errors: 0 };

  let synced = 0;
  let errors = 0;

  for (const tx of queue) {
    try {
      let endpoint = '';
      if (tx.type === 'RECEPCION') endpoint = '/almacen/ingreso';
      if (tx.type === 'DESPACHO') endpoint = '/almacen/despacho';
      if (tx.type === 'TRASLADO') endpoint = '/almacen/traslado';
      if (tx.type === 'AUDITORIA') endpoint = '/almacen/auditoria';

      const response = await axios.post(`${apiUrl}${endpoint}`, tx.payload);
      
      if (response.data && response.data.success) {
        await removeTransaction(tx.id);
        synced++;
      } else {
        errors++;
      }
    } catch (e) {
      errors++;
    }
  }

  return { total: queue.length, synced, errors };
};
