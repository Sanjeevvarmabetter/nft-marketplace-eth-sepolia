import { useState } from 'react';
import { ethers } from "ethers";
import { Row, Form, Button } from 'react-bootstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import axios from 'axios';

const Create = ({ mergedContract }) => { 
  const [image, setImage] = useState('');
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Pinata API credentials
  const pinataApiKey = "20a1ac93e10b67f081c5";
  const pinataSecretApiKey = "2b3680b650e07a507c4df5a9649b9b6438d7f8e4c3cc0cfab22a73bb968d02d7";

  /// uploading to pinata.cloud



  const uploadToPinata = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
          maxBodyLength: 'Infinity',
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          }
        });
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
        setImage(imageUrl);
        console.log(imageUrl);
        NotificationManager.success('Image uploaded successfully');
      } catch (error) {
        console.log("Pinata image upload error: ", error);
        NotificationManager.error('Image upload failed.pls try again');
      }
    }
  };



  // making the nft

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;


    try {
      const metadata = {
        image,
        name,
        description
      };

      // Upload metadata to Pinata
      const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        }
      });

      const metadataUri = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
      
      // Mint and list NFT
      await mintThenList(metadataUri);
    } catch (error) {
      console.log("Pinata metadata upload error: ", error);
      NotificationManager.error('Metadata upload failed pls try again');
    }
  };

  const mintThenList = async (metadataUri) => {
    try {
        // Mint the NFT
        const tx = await mergedContract.mint(metadataUri, ethers.utils.parseEther(price.toString()));
        const receipt = await tx.wait();

        // Check for the emitted token ID
        const tokenId = receipt.events[0].args.tokenId.toNumber();
        console.log(`NFT Minted: Token ID ${tokenId}`);

        // const listTx = await mergedContract.listNFT(tokenId, ethers.utils.parseEther(price.toString()));
        // await listTx.wait();
        
        console.log(`NFT Listed: Token ID ${tokenId} for price: ${price} ETH`);
      NotificationManager.success(`NFT minted and listed Token ID: ${tokenId}`,'success');
      } catch (error) {
        // Improved error handling
        console.error("Error in minting or listing NFT: ", error);
        NotificationManager.error('an error occured while minting or listing the NFT');
    }
};


  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control type="file" required name="file" onChange={uploadToPinata} />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
      <NotificationContainer />

    </div>
  );
};

export default Create;
