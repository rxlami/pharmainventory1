import React, { useRef } from 'react';
import { Sale, PharmacySettings } from '../types/pharmacy';
import { Printer, X, CheckCircle2, ShieldCheck, Phone, MapPin, Receipt, Share2, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: PharmacySettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const fmt = (amount: number) => formatCurrency(amount, settings.currencySymbol || '₦');

  const whatsappNumber = settings.whatsappNumber || settings.phone || '08012345678';
  const cleanPhone = (sale.customerPhone || whatsappNumber).replace(/\D/g, '');
  const internationalPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
  const itemsText = sale.items.map((it) => `• ${it.productName} (x${it.quantity}) - ₦${(it.total || 0).toLocaleString()}`).join('\n');
  const receiptMessage = encodeURIComponent(
    `*${settings.pharmacyName}*\n` +
      `*Receipt #:* ${sale.receiptNumber}\n` +
      `*Date:* ${sale.timestamp}\n` +
      `*Customer:* ${sale.customerName || 'Walk-in'}\n\n` +
      `*Dispensed Items:*\n${itemsText}\n\n` +
      `*Total Paid:* ₦${(sale.grandTotal || 0).toLocaleString()} (${sale.paymentMethod})\n\n` +
      `*Dispensary Tel:* ${settings.phone || '08012345678'}\n` +
      `*WhatsApp:* ${whatsappNumber}\n` +
      `_Thank you for trusting us with your health._`
  );
  const whatsappUrl = `https://wa.me/${internationalPhone}?text=${receiptMessage}`;

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="receipt-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Actions */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold text-sm tracking-wide">Official Pharmacy Dispensing Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="receipt-print-btn"
              onClick={handlePrint}
              className="p-1.5 hover:bg-emerald-700 rounded-lg text-emerald-100 transition-colors flex items-center gap-1 text-xs font-medium"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              id="receipt-close-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-emerald-700 rounded-lg text-emerald-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div ref={receiptRef} id="printable-receipt-content" className="p-6 bg-slate-50/50 text-slate-800 text-sm">
          {/* Pharmacy Branding */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-2">
              <span className="text-xl font-black">Rx</span>
            </div>
            <h3 className="font-bold text-base text-slate-900">{settings.pharmacyName}</h3>
            <p className="text-xs text-slate-500 font-medium">{settings.branchName}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{settings.address}, {settings.city}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-slate-600 mt-1 font-mono">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Tel: {settings.phone || '08012345678'}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp: {whatsappNumber}</span>
              </div>
            </div>
            <div className="mt-1.5 text-[10px] font-mono text-emerald-900 bg-emerald-50 py-1 px-2.5 rounded-md inline-block border border-emerald-200/60 leading-relaxed">
              <div>Premises: {settings.pcnPremisesNumber || settings.licenseNumber}</div>
              <div>Superintendent: {settings.pharmacistInCharge} ({settings.superintendentPcnLicense || 'PCN Reg'})</div>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-3 border-b border-dashed border-slate-300 text-slate-600">
            <div>
              <span className="text-slate-400 block">Receipt No:</span>
              <span className="font-mono font-semibold text-slate-800">{sale.receiptNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Date & Time:</span>
              <span className="font-medium text-slate-800">{sale.timestamp}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Dispensed By:</span>
              <span className="font-medium text-slate-800">{sale.staffName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Customer / Patient:</span>
              <span className="font-medium text-slate-800">{sale.customerName || 'Walk-in'}</span>
            </div>
            {sale.prescriptionNumber && (
              <div className="col-span-2 bg-emerald-50/80 p-1.5 rounded text-emerald-800 flex items-center justify-between text-xs">
                <span>Prescription Ref:</span>
                <span className="font-mono font-bold">{sale.prescriptionNumber}</span>
              </div>
            )}
          </div>

          {/* Itemized Medications Table */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-1 mb-2 border-b border-slate-200 grid grid-cols-12">
              <span className="col-span-6">Medication / Batch</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            <div className="space-y-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="col-span-6 pr-1">
                    <p className="font-semibold text-slate-800 leading-tight">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Lot: {item.batchNumber}</p>
                  </div>
                  <div className="col-span-2 text-center font-medium text-slate-700">{item.quantity}</div>
                  <div className="col-span-2 text-right text-slate-600 font-mono">{fmt(item.unitPrice)}</div>
                  <div className="col-span-2 text-right font-semibold text-slate-900 font-mono">
                    {fmt(item.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{fmt(sale.subtotal)}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Applied:</span>
                <span className="font-mono">-{fmt(sale.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>State / VAT ({settings.taxRate}%):</span>
              <span className="font-mono">{fmt(sale.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-700">{fmt(sale.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 pt-1">
              <span>Payment Method:</span>
              <span className="font-semibold text-slate-800">{sale.paymentMethod}</span>
            </div>
            {sale.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Amount Tendered:</span>
                  <span className="font-mono">{fmt(sale.amountTendered)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-800">
                  <span>Change Returned:</span>
                  <span className="font-mono">{fmt(sale.changeGiven)}</span>
                </div>
              </>
            )}
          </div>

          {/* Clinical Advice & Footer */}
          <div className="mt-5 pt-3 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-500 space-y-1">
            <p className="italic">{settings.receiptHeader}</p>
            <p className="text-[10px] text-slate-400 leading-normal">{settings.receiptFooter}</p>
            <div className="pt-2 flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PCN Licensed & Certified Community Pharmacy Dispensary</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3.5 flex items-center justify-between border-t border-slate-200">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Transaction Completed
          </span>
          <div className="flex items-center gap-2">
            <a
              id="receipt-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
              title={`Send via WhatsApp (${whatsappNumber})`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Receipt</span>
            </a>
            <button
              id="receipt-print-bottom-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              id="receipt-done-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
