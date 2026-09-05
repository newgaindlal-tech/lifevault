'use client';

import React from 'react';
import { resolveBrandSupport } from '@/lib/brandSupport';
import {
  ExternalLink,
  Phone,
  MessageSquare,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface BrandSupportAssistantProps {
  brand?: string | null;
  productName?: string | null;
  customSupportUrl?: string | null;
}

export const BrandSupportAssistant: React.FC<BrandSupportAssistantProps> = ({
  brand,
  productName,
  customSupportUrl,
}) => {
  const { hasKnownSupport, supportInfo, customUrl, searchFallbackUrl } = resolveBrandSupport(
    brand,
    productName,
    customSupportUrl
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <HelpCircle className="h-4 w-4 text-emerald-600" />
          <span>Official Support & Service Center</span>
        </div>
        {hasKnownSupport && (
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            Verified Brand
          </span>
        )}
      </div>

      {/* 1. Custom User-Saved Support URL (if available) */}
      {customUrl && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/60 p-2 text-xs">
          <span className="text-blue-900 font-medium truncate pr-2">
            Custom Support Link Saved
          </span>
          <a
            href={customUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold whitespace-nowrap"
          >
            <span>Open Link</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* 2. Verified Brand Directory Entry */}
      {hasKnownSupport && supportInfo && (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Toll Free Phone */}
            {supportInfo.tollFreeNumber && (
              <a
                href={`tel:${supportInfo.tollFreeNumber.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
              >
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Toll-Free</span>
                  <span className="font-bold text-slate-800">{supportInfo.tollFreeNumber}</span>
                </div>
              </a>
            )}

            {/* Official WhatsApp Line */}
            {supportInfo.whatsappNumber && (
              <a
                href={`https://wa.me/${supportInfo.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">WhatsApp Care</span>
                  <span className="font-bold text-slate-800">Chat with {supportInfo.brandName}</span>
                </div>
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Official Support Web Portal */}
            <a
              href={supportInfo.officialSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-white border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>{supportInfo.brandName} Support Portal</span>
            </a>

            {/* Service Center Locator */}
            {supportInfo.serviceCenterLocatorUrl && (
              <a
                href={supportInfo.serviceCenterLocatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md bg-white border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>Locate Authorized Service Center</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3. Fallback for uncataloged brand */}
      {!hasKnownSupport && (
        <div className="space-y-1.5 text-xs text-slate-600">
          <p className="text-[11px] text-slate-500">
            No pre-indexed service directory for &quot;{brand || productName || 'this item'}&quot;. You can launch a verified official support search:
          </p>
          <a
            href={searchFallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            <span>Search Official Service Center for {brand || productName}</span>
          </a>
        </div>
      )}
    </div>
  );
};