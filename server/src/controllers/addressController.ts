import { Request, Response } from 'express';
import { getDb } from '../services/firebase';

interface Address {
  id?: string;
  title: string;
  address: string;
  createdAt: Date;
}

const db = getDb();
const addressesCollection = db.collection('addresses');

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const getAddresses = async (_req: Request, res: Response) => {
  try {
    const snapshot = await addressesCollection.orderBy('title', 'asc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const addresses: Address[] = [];
    snapshot.forEach((doc) => {
      addresses.push({ id: doc.id, ...doc.data() } as Address);
    });

    res.status(200).json(addresses);
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ message: 'Server error while getting addresses' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const title = normalizeText(req.body?.title);
    const address = normalizeText(req.body?.address);

    if (!title || !address) {
      return res.status(400).json({ message: 'title and address are required' });
    }

    const newAddress: Omit<Address, 'id'> = {
      title,
      address,
      createdAt: new Date(),
    };

    const docRef = await addressesCollection.add(newAddress);
    res.status(201).json({ id: docRef.id, ...newAddress });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ message: 'Server error while creating address' });
  }
};
