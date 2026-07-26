import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { View, Platform } from 'react-native';

const WebSignature = forwardRef(({ onOK }: any, ref) => {
  const sigPad = useRef<any>(null);
  
  useImperativeHandle(ref, () => ({
    clearSignature: () => sigPad.current?.clear(),
    readSignature: () => {
      if (sigPad.current?.isEmpty()) {
        if (Platform.OS === 'web') window.alert('Por favor, dibuje su firma.');
      } else {
        const dataURL = sigPad.current?.toDataURL('image/png');
        onOK(dataURL);
      }
    }
  }));

  return (
    <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' }}>
      <SignatureCanvas
        ref={sigPad}
        canvasProps={{
          style: { width: '100%', height: '100%', touchAction: 'none' }
        }}
      />
    </View>
  );
});

export default WebSignature;
