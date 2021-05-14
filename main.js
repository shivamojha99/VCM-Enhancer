import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBb9AOn0-zoSPwXgFlBuvP1Pxtc4ZbakLI",
  authDomain: "video-moments-enhancer.firebaseapp.com",
  projectId: "video-moments-enhancer",
  storageBucket: "video-moments-enhancer.appspot.com",
  messagingSenderId: "370418589412",
  appId: "1:370418589412:web:b86a0f2e4cb7b0584656f1",
  measurementId: "G-HBVB4PX68F"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};
var db = firebase.firestore();
// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;
var canvas = null;
var canvas1 = null;
var photo = null;
var width = 500;          // We will scale the photo width to this
var height = 500;
var me=[];
var friend=[];

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
canvas = document.getElementById('canvas');
canvas1 = document.getElementById('canvas1');
photo = document.getElementById('photo');

// 1. Setup media sources

webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };


  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
  webcamVideo.play();
//  height = webcamVideo.videoHeight / (webcamVideo.videoWidth/width);

  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  canvas1.setAttribute('width', width);
  canvas1.setAttribute('height', height);
 
  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;

};

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

///----PEHLE YAHA PE THA--//
  
  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  hangupButton.disabled = false;
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  //----Capturing images for me ----//
 
 

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};

//---Convert into png image---//

var myVar = setInterval(myTimer, 10000);
var cnt=0;
function myTimer() {
  takepicture();
  takepicture1();
  cnt++;
  if(cnt==7)
  {
    clearInterval(myVar);
  }
}



function takepicture() {
  console.log('1');
  var context = canvas.getContext('2d');
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(webcamVideo, 0, 0, width, height);
   
    var data = canvas.toDataURL('image/png');

    //----Storing baseUrls in firebase--//

    db.collection("baseurls_me").add({
      person: 1,
      me_string: data,
  })








    //-------------------------------//
    //----sending through API--//
  //   fetch("http://f295ea6407df.ngrok.io/", {
      
  //     method: "POST",
  //     body: JSON.stringify({
  //         person: 1,
  //         baseUrl: data,
          
  //     }),
  //     headers: {
  //         "Content-type": "application/json; charset=UTF-8"
  //     }
  // })
  // .then(response => response.json())
    
  // .then(json => console.log(json));

    //-----OVER---//
    me.push(data);
  }

  else {
    clearphoto();
  }
}

function takepicture1() {
  console.log('2');
  var context = canvas1.getContext('2d');
  if (width && height) {
    canvas1.width = width;
    canvas1.height = height;
    context.drawImage(webcamVideo, 0, 0, width, height);
    //console.log('h1');
    var data = canvas1.toDataURL('image/png');

    db.collection("baseurls_friend").add({
      person: 2,
      me_string: data,
  })

    friend.push(data);
    //console.log(data);    
    // photo.setAttribute('src', data);
  }

  else {
    clearphoto1();
  }
}

function clearphoto() {
  var context = canvas.getContext('2d');
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);

  var data = canvas.toDataURL('image/png');
  // photo.setAttribute('src', data);
}

function clearphoto1() {
  var context = canvas1.getContext('2d');
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas1.width, canvas1.height);

  var data = canvas1.toDataURL('image/png');
  // photo.setAttribute('src', data);
}

hangupButton.onclick = async () => {

  pc.close();
  console.log(1);
  for(var i=0;i<me.length;i++)
  {
    console.log(me[i]);
  }

 

}





