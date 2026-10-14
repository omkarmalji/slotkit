import type { ReactNode } from 'react';
import { DemoSettingsProvider } from '@/docs/demo-settings';
import { SideNav } from '@/docs/side-nav';

export default function ComponentsLayout({ children }: { children: ReactNode }) {
  return (
    <DemoSettingsProvider>
      <div className="mx-auto flex max-w-page gap-10 px-4 sm:px-6">
        <SideNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </DemoSettingsProvider>
  );
}
