import React from 'react';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`bg-light-ash/60 animate-pulse rounded-lg ${className}`} />
  );
}
