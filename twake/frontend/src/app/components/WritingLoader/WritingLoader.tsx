import React from 'react';
import './WritingLoader.scss';

export default (): JSX.Element => {
  return (
    <div>
      <div data-title=".dot-typing" style={{ color: 'var(--primary)' }}>
        <div className="stage">
          <div className="dot-typing"></div>
        </div>
      </div>
    </div>
  );
};