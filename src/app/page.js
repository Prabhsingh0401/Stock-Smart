'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material';
import { firestore } from '../firebase';
import './page.scss';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ 
        name: doc.id, 
        ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const filteredInventory = inventory.filter(({ name }) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Log image capture confirmation
    console.log('Image captured and drawn on canvas');
    
    processImage(canvas);
  };
  
  const processImage = async (canvas) => {
    const imageBlob = await new Promise(resolve => canvas.toBlob(resolve));
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');
    
    // Log form data for debugging
    console.log('Sending image to server:', formData);
  
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      // Log server response
      console.log('Server response:', data);
  
      if (data.item) {
        await addItem(data.item);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  return (
    <>
      <div className='hero-section'>
        <div className='hero-left'><h1>Stock Smart</h1></div>
        <div className='hero-right'><p>Organize and manage any inventory with ease using our versatile app</p></div>
      </div>
      <Box width="100vw" height="100vh" display="flex" justifyContent="center" flexDirection="column" alignItems="center" gap={2}>
        <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">Add Item</Typography>
            <Stack width="100%" direction="row" spacing={2}>
              <TextField id="outlined-basic" label="Item" variant="outlined" fullWidth value={itemName} onChange={(e) => setItemName(e.target.value)} />
              <Button
                variant="contained"
                onClick={() => {
                  addItem(itemName);
                  setItemName('');
                  handleClose();
                }}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#45a049',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Stack direction="row" spacing={2} width="1200px">
          <TextField label="Search Items" variant="outlined" fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Button variant="contained" onClick={handleOpen} paddingX={8}>Add Item</Button>
        </Stack>
        <Box width="1200px" overflow="hidden">
          <Box height="100px" bgcolor="#b1ffff" display="flex" justifyContent="left" alignItems="center" borderRadius="20px" marginBottom="5vh">
            <Typography variant="h3" color="#333" textAlign="center" fontWeight="600" marginLeft="3vw">What&apos;s on your list</Typography>
          </Box>
          <Stack height="300px" spacing={2} overflow="auto">
            {filteredInventory.map(({ name, quantity }) => (
              <Box
                key={name}
                width="93.3%"
                minHeight="90px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bgcolor="#e4e4e460"
                paddingX={5}
                borderRadius="20px"
              >
                <Typography variant="h5" color="#333" textAlign="center">{name.charAt(0).toUpperCase() + name.slice(1)}</Typography>
                <Typography variant="h5" color="#333" textAlign="center">Quantity: {quantity}</Typography>
                <Stack direction="row" spacing={4} paddingX={5}>
                  <Button variant="contained" onClick={() => addItem(name)}>Add</Button>
                  <Button variant="contained" onClick={() => removeItem(name)}>Remove</Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
      <video ref={videoRef} autoPlay style={{ position: 'fixed', top: 0, right: 0, width: '300px', height: 'auto'}}></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <Button onClick={startCamera} disabled={cameraActive}>Start Camera</Button>
      <Button onClick={stopCamera} disabled={!cameraActive}>Stop Camera</Button>
      <Button onClick={captureImage} disabled={!cameraActive}>Capture Image</Button>
    </>
  );
}
