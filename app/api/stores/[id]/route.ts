import type { NextRequest } from 'next/server';
import storeManager, { StoreInput } from '../../../../src/models/Store';
import { savePersistedData } from '../../../../src/lib/persistence';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET handler for retrieving a single store
 * @param request - The incoming request
 * @param params - Route parameters containing store ID
 * @returns JSON response with store data
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const store = storeManager.getById(id);

    if (!store) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return Response.json({ store });
  } catch (error) {
    console.error('Error fetching store:', error);
    return Response.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a store
 * @param request - The incoming request with updated store data
 * @param params - Route parameters containing store ID
 * @returns JSON response with updated store
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const body: Partial<StoreInput> = await request.json();

    const store = storeManager.update(id, body);

    if (!store) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return Response.json({ store });
  } catch (error) {
    console.error('Error updating store:', error);
    return Response.json(
      { error: 'Failed to update store' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a store
 * @param request - The incoming request
 * @param params - Route parameters containing store ID
 * @returns JSON response with deletion result
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params;
    const deleted = storeManager.delete(id);

    if (!deleted) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return Response.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    return Response.json(
      { error: 'Failed to delete store' },
      { status: 500 }
    );
  }
}