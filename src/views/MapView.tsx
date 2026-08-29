import React from 'react';
import { useStore } from '../lib/store/useStore';
import { RailwayMap } from '../components/map/RailwayMap';

export const MapView: React.FC = () => {
  const { defects } = useStore();

  return (
    <div className="space-y-6 select-none">
      <RailwayMap defects={defects} />
    </div>
  );
};
