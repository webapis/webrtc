import React, {useEffect, useState} from 'react'
import iceServers from './ice-servers';
const BYTES_PER_CHUNK=100;
export default function useWebRTC ({signalingMessage,sendSignalingMessage, readProgress,startReadingFileBySlice, fileChunk,file}){
    const [pc, setPc] = useState(null);
    const [error, setError] = useState(null);
    const [remoteIceCandidates, setRemoteIceCandidates] = useState([]);
    const [remoteOffer, setRemoteOffer] = useState(null);
    const [remoteFile,setRemoteFile]= useState(null);
    const [bytesRecieved,setBytesRecieved]= useState(0)
	const [initiator, setInitiator] = useState(false);
	const [connected,setConnected] =useState(false);
	const [datachannel,setDatachannel]=useState(null);
	const [signalingState, setSignalingState] = useState(null);
	const [connectionState, setConnectionState] = useState(null);
	const [iceConnectionState, setIceConnectionState] = useState(null);
    const [iceGatheringState, setIceGatheringState] = useState(null);
    const [incomingFileData,setIncomingFileData]= useState([]);
    const [downloadProgress,setDownloadProgress]=useState(0);


    useEffect(()=>{
        if(readProgress){
        debugger;
        }
    },[readProgress])

    useEffect(()=>{
        if(bytesRecieved>0){
         
            let progress =((bytesRecieved * 100)/ remoteFile.size ).toFixed()
            setDownloadProgress(Number.parseInt(progress))
          
        }
    },[bytesRecieved])
 

    useEffect(()=>{
     
        if(downloadProgress>0){
       
        }
    },[downloadProgress])

    useEffect(()=>{
        if(fileChunk){
          
            sendFileChunk(fileChunk);
        }
    },[fileChunk])
   


    useEffect(()=>{
        if(pc && initiator){
         
            let channel = pc.createDataChannel('chat');
          //  channel.binaryType = 'arraybuffer'
			channel.onopen = () => {
				setConnected(true);
			};
			channel.onmessage = (event) => {
           
         
			};
			channel.onclose =() => {
				setConnected(false);
			};
			channel.onerror = (err) => {
                setError(err);
                debugger;
			};
            setDatachannel(channel) ;
            
        }
    },[pc,initiator])

    useEffect(()=>{
        if(pc && datachannel && initiator){
          
            pc.createOffer()
            .then((localOffer)=> {
              
                pc.setLocalDescription(localOffer);
            })
            .then(()=>{
          
              const fileInfo ={size:file.size,name:file.name,type:file.type}
                sendSignalingMessage({type:'file-offer', sdp:pc.localDescription,fileInfo })

            })
            .catch((err)=>{
                debugger;
                setError(err);
            })
        }
    },[datachannel,pc,initiator])


    useEffect(()=>{

        if(pc && remoteOffer){
      
            pc.ondatachannel = (event) => {
                let channel = event.channel;
                channel.onopen = () => {
                    setConnected(true);
                };
                channel.onmessage = (event) => {
                  
                    setIncomingFileData(prevState => [...prevState,event.data])
                    setBytesRecieved(prevState => prevState + event.data.byteLength)
               
                };
                channel.onclose =() => {
                    setConnected(false);
    
                };
                channel.onerror = (err) => {
                    setError(err);
                    debugger;
                };
                setDatachannel(channel);
              };
              pc.setRemoteDescription(remoteOffer)
              .then(()=>{
              
                  return pc.createAnswer()
              })
              .then((localAnswer)=>{
               
                  pc.setLocalDescription(localAnswer);
              })
              .then(() => {
                 
                  if (remoteIceCandidates.length > 0) {
                      for (let ice in remoteIceCandidates) {
                          if (ice) {
                              pc.addIceCandidate(remoteIceCandidates[ice]);
                          }
                      }
                  }
              })
              .catch((err)=>{
                  debugger;
                  setError(err);
              })
        }
   
    },[pc, remoteOffer])


    useEffect(()=>{
        if(signalingMessage){
            switch(signalingMessage.type){
                case 'file-offer':
                    createRTCPeerConnection(iceServers)
                    setRemoteOffer(signalingMessage.sdp);
                    setRemoteFile(signalingMessage.fileInfo)
                  
                    break;
                case 'file-answer':
               
                    remoteAnswerRecieved(signalingMessage.sdp)
                    break;
                case 'file-decline':
                    break;
                case 'file-end':
                    break;
                case 'file-start':
                    break;
                case 'ice':
                    remoteIceRecieved(signalingMessage.sdp)
                    break;
                default:
            }
        }
    },[signalingMessage])

 
    function createLocalOffer (){
      
        createRTCPeerConnection()
        setInitiator(true);
    }

    function sendLocalAnswer (){
        
        sendSignalingMessage({type:'file-answer', sdp:pc.localDescription})
    }

    function createRTCPeerConnection(){
     
    	let peerCon = new RTCPeerConnection(iceServers);
		peerCon.onicecandidate = function(e) {
			if (e.candidate) {
				sendSignalingMessage({ sdp: e.candidate, type: 'ice' });
			}
		};
		peerCon.onconnectionstatechange = () => {
			setConnectionState(peerCon.connectionState);
		};
		peerCon.onsignalingstatechange = () => {
			setSignalingState(peerCon.signalingState);
		};
		peerCon.oniceconnectionstatechange = () => {
			setIceConnectionState(peerCon.iceConnectionState);
		};
		peerCon.onicegatheringstatechange = () => {
			setIceGatheringState(peerCon.iceGatheringState);
		};
		setPc(peerCon);
        
    }

    function remoteAnswerRecieved (answer){
      
        if (pc.setLocalDescription  && pc.remoteDescription===null) {
			pc.setRemoteDescription(answer)
				.then(() => {
                
					if (remoteIceCandidates.length > 0) {
						for (let ice in remoteIceCandidates) {
							if (ice) {
								pc.addIceCandidate(remoteIceCandidates[ice]);
							}
						}
					}
                })
                .then(()=>{
                    startReadingFileBySlice();
                })
				
				.catch(err => {
					debugger;
					setError(err)});
		}
    }

    function remoteIceRecieved (ice){
        if ( pc && pc.remoteDescription) {
			pc.addIceCandidate(ice);
		}
		else {
			setRemoteIceCandidates(prev => [...prev, ice]);
		}
    }

    function handleSendMessage (type){
        switch(type){
            case 'file-offer':
           
            createLocalOffer();
            break;
            case 'file-answer':
            sendLocalAnswer();
            break;
            case 'file-decline':
            break;
            default:
        }
    }

    function sendFileChunk (fileChunk){
    
      //  datachannel.channel.binaryType = 'arraybuffer'
        datachannel.send(fileChunk);
     
        if(readProgress<100){
            
           
            startReadingFileBySlice();
        }
     
    }

    return {handleSendMessage, state:{iceConnectionState,iceGatheringState,connectionState,signalingState},error,downloadProgress}
}