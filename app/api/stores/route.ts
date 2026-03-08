import type { NextRequest } from 'next/server';
import storeManager, { StoreInput } from '../../../src/models/Store';
import { savePersistedData } from '../../../src/lib/persistence';

/**
 * GET handler for retrieving all stores
 * @returns JSON response with all stores
 */
export async function GET(_request: NextRequest): Promise<Response> {
  const stores = storeManager.getAll();
  return Response.json({ stores });
}

/**
 * POST handler for creating a new store
 * @param request - The incoming request with store data
 * @returns JSON response with created store
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: StoreInput = await request.json();
    const { name, address, description } = body;

    if (!name || !address) {
      return Response.json(
        { error: 'Missing required fields: name and address are required' },
        { status: 400 }
      );
    }

    const store = storeManager.create({
      name,
      address,
      description: description || ''
    });

    return Response.json({ store }, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return Response.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
}