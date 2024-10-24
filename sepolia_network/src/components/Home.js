import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const Home = ({ mergedContract }) => {

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const DECIMALS = 18;

  // Load marketplace items
  const loadMarketplaceItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemCount = await mergedContract.itemCount();
      const loadedItems = await Promise.all(
        Array.from({ length: itemCount }, (_, i) => i + 1).map(async (i) => {
          const item = await mergedContract.items(i);
          if (!item.sold) {
            const uri = await mergedContract.tokenURI(item.tokenId);
            const response = await fetch(uri);
            if (!response.ok) throw new Error(`Failed to fetch metadata for token ${item.tokenId}`);
            const metadata = await response.json();
            const formattedPrice = ethers.utils.formatUnits(item.price, DECIMALS);
            return {
              itemId: item.itemId.toString(),
              seller: item.seller,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image,
              price: formattedPrice,
            };
          }
          return null;
        })
      );
      setItems(loadedItems.filter(item => item));
    } catch (error) {
      console.error("Error loading marketplace items:", error);
      setError("Failed to load marketplace items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const buyMarketItem = async (item) => {
    try {
      const totalPrice = await mergedContract.getTotalPrice(item.itemId);
      const transaction = await mergedContract.purchaseItem(item.itemId, {
        value: totalPrice,
        gasLimit: 500000,
      });
      await transaction.wait();
      loadMarketplaceItems(); 
    } catch (error) {
      console.error("Error purchasing item:", error);
      setError("Failed to purchase item. Please check your wallet or network.");
    }
  };

  useEffect(() => {
    loadMarketplaceItems();
  }, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            {error && <Alert variant="danger">{error}</Alert>}
            {items.length > 0 ? (
              <Row xs={1} md={2} lg={4} className="g-4">
                {items.map((item) => (
                  <Col key={item.itemId} className="overflow-hidden">
                    <div className="card" style={{ width: '18rem' }}>
                      <img className="card-img-top" src={item.image} alt={item.name} />
                      <div className="card-body">
                        <h5 className="card-title">{item.name}</h5>
                        <p className="card-text">{item.description}</p>
                        <p>Price: {item.price} ETH</p>
                        <Button onClick={() => buyMarketItem(item)} variant="primary" aria-label={`Buy ${item.name} NFT`}>
                          Buy NFT
                        </Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <h2>No listed items</h2>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
