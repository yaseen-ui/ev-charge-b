import './globals.css';

export const metadata = {
  title: 'EV Charging Station Load Balancer',
  description: 'Monitor station status, vehicle queue, and engine controls.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
