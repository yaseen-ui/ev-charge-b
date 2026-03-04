import { NextRequest } from 'next/server';
import updateEmitter from '../../../src/lib/Events';
import station from '../../../src/lib/Station';
import engine from '../../../src/lib/Engine';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = () => {
        const data = JSON.stringify({
          station: station.getStatus(),
          vehicles: station.getVehiclesWithTimeEstimates(),
          engine: engine.getStatus()
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Send initial data
      sendUpdate();

      // Listen for updates
      updateEmitter.on('update', sendUpdate);

      // Clean up when the connection is closed
      _request.signal.addEventListener('abort', () => {
        updateEmitter.off('update', sendUpdate);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
