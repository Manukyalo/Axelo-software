import React from 'react';
import { format, parseISO } from 'date-fns';

export const PrintBooking = ({ booking, state }) => {
  if (!booking) return null;

  const driver = state.drivers.find(d => d.id === booking.driverId);
  const vehicle = state.vehicles.find(v => v.id === booking.vehicleId);
  const balance = (booking.totalAmount || 0) - (booking.paidAmount || 0);

  return (
    <div className="print-only bg-white text-black p-10 font-sans max-w-[800px] mx-auto border-2 border-gray-100 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-safari-gold pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-safari-primary mb-2">Eastern Vacations</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-safari-gold">Safari & Tours Expedition Confirmation</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-jetbrains font-bold text-safari-primary">{booking.id}</p>
          <p className="text-xs text-gray-400 font-bold uppercase">Booking Reference</p>
        </div>
      </div>

      {/* Intro */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-safari-gold pl-4">Reservation Details</h2>
        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Lead Client</p>
            <p className="text-lg font-bold text-safari-primary">{booking.clientName}</p>
            <p className="text-sm text-gray-500">{booking.clientEmail}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Trip Date</p>
            <p className="text-lg font-bold text-safari-primary">{format(parseISO(booking.date), 'EEEE, MMMM dd, yyyy')}</p>
            <p className="text-sm text-gray-500">Pickup: {booking.timeOfPickup || 'TBA'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Destinations</p>
            <p className="text-sm font-bold text-safari-primary leading-relaxed">{booking.location}</p>
            <p className="text-xs text-gray-500">{booking.destinations || 'Standard Route'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Pax Breakdown</p>
            <p className="text-sm font-bold text-safari-primary">
              {booking.pax?.adults || 1} Adults, {booking.pax?.children || 0} Children, {booking.pax?.infants || 0} Infants
            </p>
            <p className="text-xs text-gray-500">Total Group Size: {(booking.pax?.adults || 1) + (booking.pax?.children || 0) + (booking.pax?.infants || 0)}</p>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="mb-10 grid grid-cols-2 gap-8">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
           <h3 className="text-xs font-bold uppercase tracking-widest text-safari-gold mb-4 flex items-center gap-2">
             <span>Assigned Personnel</span>
           </h3>
           <p className="text-lg font-bold text-safari-primary">{driver ? driver.name : 'Asset Pending Allocation'}</p>
           <p className="text-xs text-gray-500 uppercase font-bold mt-1">Professional Safari Guide</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
           <h3 className="text-xs font-bold uppercase tracking-widest text-safari-gold mb-4 flex items-center gap-2">
             <span>Fleet Allocation</span>
           </h3>
           <p className="text-lg font-bold text-safari-primary">{vehicle ? `${vehicle.name} (${vehicle.plate})` : 'Vehicle TBA'}</p>
           <p className="text-xs text-gray-500 uppercase font-bold mt-1">Vehicle Class: {booking.type || 'Safari Van'}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-safari-gold pl-4">Financial Statement</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-safari-primary text-white">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-safari-primary">Base Tour & Logistics Package Cost</td>
                <td className="px-6 py-4 text-right font-jetbrains font-bold text-sm">${booking.totalAmount?.toLocaleString()}</td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-6 py-4 text-sm font-bold text-green-700">Total Payments Received</td>
                <td className="px-6 py-4 text-right font-jetbrains font-bold text-sm text-green-700">-${booking.paidAmount?.toLocaleString()}</td>
              </tr>
              <tr className="bg-safari-gold/5">
                <td className="px-6 py-4 text-lg font-black text-safari-primary uppercase tracking-tighter">Outstanding Balance</td>
                <td className="px-6 py-4 text-right font-jetbrains font-extrabold text-xl text-safari-gold">${balance.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Terms */}
      <div className="mt-16 pt-8 border-t border-gray-100 text-[10px] text-gray-400 leading-normal">
        <p className="mb-4">
          <span className="font-bold text-gray-600 uppercase">Terms & Conditions:</span> All safaris are subject to weather and park accessibility. 
          Eastern Vacations reserves the right to modify routes for safety or logistical optimization. Professional guides are authorized 
          to make final decisions on-site. Payments are governed by our standard cancellation policy.
        </p>
        <div className="flex justify-between items-end">
          <div>
            <p className="font-bold text-safari-primary uppercase mb-1">Eastern Vacations System</p>
            <p>www.easternvacationskenya.com • info@easternvacationskenya.com</p>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase text-gray-600">Generated On</p>
            <p>{format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important;
            padding: 40px !important;
            box-shadow: none !important;
            border: none !important;
          }
          button { display: none !important; }
        }
      `}} />
    </div>
  );
};
