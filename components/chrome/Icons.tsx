'use client';

import React from 'react';

const S = ({
  size = 19,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ display: 'block' }}
  >
    {children}
  </svg>
);

export const IconMap = (p: { size?: number }) => (
  <S {...p}>
    <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5Z" />
    <path d="M9 4v13M15 6.5v13" />
  </S>
);
export const IconList = (p: { size?: number }) => (
  <S {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </S>
);
export const IconCheck = (p: { size?: number }) => (
  <S {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </S>
);
export const IconUp = (p: { size?: number }) => (
  <S {...p}>
    <path d="M12 20V5M5 12l7-7 7 7" />
  </S>
);
export const IconCloud = (p: { size?: number }) => (
  <S {...p}>
    <path d="M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18Z" />
  </S>
);
export const IconWrench = (p: { size?: number }) => (
  <S {...p}>
    <path d="M15.6 3.6a5 5 0 0 0-6.3 6.3L3.7 15.5a2 2 0 0 0 2.8 2.8l5.6-5.6a5 5 0 0 0 6.3-6.3l-2.9 2.9-2.6-.7-.7-2.6Z" />
  </S>
);
export const IconGrid = (p: { size?: number }) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </S>
);
export const IconGear = (p: { size?: number }) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </S>
);
export const IconBell = (p: { size?: number }) => (
  <S {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </S>
);
export const IconSearch = (p: { size?: number }) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </S>
);
export const IconChevron = (p: { size?: number }) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);
export const IconShield = (p: { size?: number }) => (
  <S {...p}>
    <path d="M12 3 5 6v5.5c0 4.4 2.9 7.9 7 9.5 4.1-1.6 7-5.1 7-9.5V6Z" />
  </S>
);
export const IconCar = (p: { size?: number }) => (
  <S {...p}>
    <path d="M5 16.5h14M4 16.5v2.5h3v-2.5M17 16.5V19h3v-2.5" />
    <path d="M4.5 16.5v-4l1.8-4.2A2 2 0 0 1 8.1 7h7.8a2 2 0 0 1 1.8 1.3l1.8 4.2v4Z" />
    <path d="M7.5 13h.01M16.5 13h.01" />
  </S>
);
export const IconDownload = (p: { size?: number }) => (
  <S {...p}>
    <path d="M12 3.5v11M7.5 10 12 14.5 16.5 10M4 19.5h16" />
  </S>
);
