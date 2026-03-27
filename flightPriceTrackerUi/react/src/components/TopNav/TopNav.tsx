import React from 'react';

interface TopNavProps {
  title?: string;
  actions?: React.ReactNode;
}

export default function TopNav({ title, actions }: TopNavProps) {
  return (
    <div className="sticky top-0 z-30 bg-primary flex w-full" style={{ minHeight: '32px' }}>
      <div className="flex flex-1 items-center justify-between pl-8 md:pl-4 pr-4 border-b border-weak">
        <h2 className="text-base">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
