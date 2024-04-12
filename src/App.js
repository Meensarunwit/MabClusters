import Supercluster from 'supercluster';
import Map from 'react-map-gl';
import { Marker } from 'react-map-gl';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [markers, setMarkers] = useState([]);
  const [offset, setOffset] = useState(0);
  const [cluster, setCluster] = useState(null); // State for Supercluster instance
  const [popupInfo, setPopupInfo] = useState(null); // State for Popup
  const [selectedCluster, setSelectedCluster] = useState(null); // State for selected Cluster

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://v2k-dev.vallarismaps.com/core/api/features/1.1/collections/658cd4f88a4811f10a47cea7/items?api_key=bLNytlxTHZINWGt1GIRQBUaIlqz9X45XykLD83UkzIoN6PFgqbH7M7EDbsdgKVwC&limit=10000&offset=${offset}`);
        setMarkers(prevMarkers => [...prevMarkers, ...response.data.features]);
        setOffset(offset + 10000);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [offset]);

  useEffect(() => {
    if (markers.length > 0) {
      const index = new Supercluster({
        radius: 60,
        maxZoom: 16,
      });
      index.load(markers.map(marker => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [marker.geometry.coordinates[0], marker.geometry.coordinates[1]],
        },
        properties: {
          ...marker.properties,
        },
      })));
      setCluster(index);
    }
  }, [markers]);

  const handleClusterClick = clusterObj => {
    if (clusterObj && clusterObj.properties && clusterObj.properties.cluster) {
      const ct_tn = clusterObj.properties.ct_tn !== undefined ? clusterObj.properties.ct_tn : 'N/A';
      setSelectedCluster(clusterObj);
      setPopupInfo({
        longitude: clusterObj.geometry.coordinates[0],
        latitude: clusterObj.geometry.coordinates[1],
        content: `ct_tn ${ct_tn}`,
      });
    } else {
      console.log("No cluster info available");
      setSelectedCluster(null);
      setPopupInfo(null);
    }
  };

  const handleClosePopup = () => {
    setSelectedCluster(null);
    setPopupInfo(null);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'top', height: '100vh' }}>
    <div>
    <h1>Map Example Clusters </h1>
    <Map
      mapboxAccessToken="pk.eyJ1IjoibWVlbml0IiwiYSI6ImNsdXY4cW13eDAweGQybHBib3AwZnF6cTgifQ.Ip8O3Y5o9HNEan4FtSmUgA"
      initialViewState={{
        longitude: 103,
        latitude: 15,
        zoom: 5,
      }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1300,
        height: 550,
        borderRadius: '15px',
      }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {cluster &&
        cluster.getClusters([-180, -90, 180, 90], Math.round(5)).map(clusterObj => {
          const [longitude, latitude] = clusterObj.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = clusterObj.properties;
          let clusterColor;

          if (pointCount >= 10000) {
            clusterColor = 'red';
          } else if (pointCount >= 1000) {
            clusterColor = 'orange';
          }else if(pointCount >= 100){
            clusterColor = 'blue';
          }else {
            clusterColor = 'green';
          }

          return (
            <Marker
              key={isCluster ? `cluster-${clusterObj.id}` : `marker-${clusterObj.id}`}
              longitude={longitude}
              latitude={latitude}
              onClick={() => handleClusterClick(clusterObj)}
            >
              <div
                style={{
                  backgroundColor: clusterColor,
                  borderRadius: '50%',
                  width: `${50 + (pointCount / markers.length) * 120}px`,
                  height: `${50 + (pointCount / markers.length) * 120}px`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                {pointCount}
              </div>
            </Marker>
          );
        })}
      {popupInfo && selectedCluster && (
        <Marker
          key="popup"
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
        >
            <div style={{ background: 'white', padding: '5px', borderRadius: '5px', width: '200px',height:'300px' }}>
            {popupInfo.content}
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </Marker>
      )}
    </Map>
    </div>
    </div>
  );
}

export default App;
