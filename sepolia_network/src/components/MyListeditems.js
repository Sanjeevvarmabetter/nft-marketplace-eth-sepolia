import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';

const MyListedItems = ({ mergedContract, account }) => {
  const [loading, setLoading] = useState(true);
  const [listedItems, setListedItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [error, setError] = useState(null);
  const DECIMALS = 18;

  const loadListedItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemCount = await mergedContract.itemCount();
      const listed = [];
      const sold = [];
      for (let i = 1; i <= itemCount; i++) {
        const item = await mergedContract.items(i);
        if (item.seller.toLowerCase() === account.toLowerCase()) {
          const uri = await mergedContract.tokenURI(item.tokenId);
          const response = await fetch(uri);
          if (!response.ok) throw new Error(`Failed to fetch metadata for token ${item.tokenId}`);
          const metadata = await response.json();
          const totalPrice = await mergedContract.getTotalPrice(item.itemId);
          
          const listItem = {
            totalPrice,
            price: item.price,
            itemId: item.itemId,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            sold: item.sold,
          };
          listed.push(listItem);
          if (item.sold) sold.push(listItem);
        }
      }
      setListedItems(listed);
      setSoldItems(sold);
    } catch (error) {
      console.error("Error loading listed items:", error);
      setError("Failed to load listed items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListedItems();
  }, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            {error && <Alert variant="danger">{error}</Alert>}
            {listedItems.length > 0 ? (
              <div className="px-5 py-3 container">
                <h2>Listed Items</h2>
                <Row xs={1} md={2} lg={4} className="g-4 py-3">
                  {listedItems.map((item, idx) => (
                    <Col key={idx} className="overflow-hidden">
                      <Card>
                        <Card.Img variant="top" src={item.image} />
                        <Card.Body>
                          <Card.Title>{item.name}</Card.Title>
                          <Card.Text>{item.description}</Card.Text>
                          <p>Price: {ethers.utils.formatUnits(item.price, DECIMALS)} ETH</p>
                          {item.sold ? (
                            <Button variant="secondary" disabled>
                              Sold
                            </Button>
                          ) : (
                            <Button variant="primary" disabled>
                              Listed for Sale
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {soldItems.length > 0 && (
                  <>
                    <h2>Sold Items</h2>
                    <Row xs={1} md={2} lg={4} className="g-4 py-3">
                      {soldItems.map((item, idx) => (
                        <Col key={idx} className="overflow-hidden">
                          <Card>
                            <Card.Img variant="top" src={item.image} />
                            <Card.Footer>
                              Sold for {ethers.utils.formatUnits(item.totalPrice, DECIMALS)} ETH (Received {ethers.utils.formatUnits(item.price, DECIMALS)} ETH)
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}
              </div>
            ) : (
              <main style={{ padding: '1rem 0' }}>
                <h2>No listed assets</h2>
              </main>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyListedItems;
