import { useEffect, useState } from 'react';

export default function useCaller({
  state,
  signalingMessage,
  sendSignalingMessage,
  createRTCPeerConnection,
  rtcPeerConnection,
  getLocalMediaStream,
  localMediaStream,
  remoteIceCandidates
}) {
  const [callerError, setCallerError] = useState(false);
  const [initiated, setInitiated] = useState(false);

  function resetState() {
    setInitiated(false);
    setCallerError(null);
  }

  useEffect(() => {
    return () => {
      if (state.signalingState === 'closed') {
        // debugger;
        resetState();
      }
    };
  });
  function initiateOffer() {
    // debugger; // 1.Caller
    setInitiated(true);
  }
  useEffect(() => {
    if (initiated) {
      //  debugger; // 1.1 Caller

      getLocalMediaStream();
    }
  }, [initiated]);

  useEffect(() => {
    if (localMediaStream && initiated) {
      //  debugger; //2. Caller
      createRTCPeerConnection();
    }
  }, [localMediaStream, initiated]);

  useEffect(() => {
    if (rtcPeerConnection && localMediaStream && initiated) {
      //  debugger; //3.Caller
      localMediaStream.getVideoTracks().forEach(t => {
        rtcPeerConnection.addTrack(t, localMediaStream);
      });
    }
  }, [rtcPeerConnection, localMediaStream]);

  useEffect(() => {
    if (rtcPeerConnection && rtcPeerConnection.getReceivers().length > 0) {
      // debugger; //4.Caller
      rtcPeerConnection
        .createOffer()
        .then(offer => {
          //   debugger; //5.Caller
          rtcPeerConnection.setLocalDescription(offer);
        })
        .then(() => {
          //  debugger; // 6. Caller
          sendSignalingMessage({
            sdp: rtcPeerConnection.localDescription,
            type: 'offer'
          });
        })
        .catch(err => {
          //  debugger; //6.1 Caller
          setCallerError(err);
        });
    }
  }, [rtcPeerConnection]);

  useEffect(() => {
    if (
      signalingMessage &&
      signalingMessage.type == 'answer' &&
      rtcPeerConnection
    ) {
      //   debugger; // 7. Caller
      rtcPeerConnection
        .setRemoteDescription(signalingMessage.sdp.sdp)
        .then(() => {
          //  debugger; //8.Caller
          if (remoteIceCandidates.length > 0) {
            for (let ice in remoteIceCandidates) {
              if (ice) {
                rtcPeerConnection.addIceCandidate(remoteIceCandidates[ice]);
              }
            }
          }
        })
        .catch(err => {
          setCallerError(err); //8.1. Caller
        });
    }
  }, [signalingMessage, rtcPeerConnection]);

  return { initiateOffer, callerError };
}
