import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import axios from "axios";
import "leaflet/dist/leaflet.css";
import "./App.css";
import L from "leaflet";
import Swal from "sweetalert2";
import LocationMap from "./component/LocationMap"; // Import LocationMap component

const base_url = import.meta.env.VITE_API_BASE_URL;

// Define custom icons
const storeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/7877/7877890.png", //ไอคอนร้านค้า
  iconSize: [38, 38],
  iconAnchor: [22, 38],
  popupAnchor: [0, -40],
});

const houseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/7720/7720526.png", //ไอคอนบ้าน
  iconSize: [38, 38],
  iconAnchor: [22, 38],
  popupAnchor: [0, -40],
});

// Custom icon for selected store
const selectedStoreIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/3075/3075977.png", // ไอคอนใหม่สำหรับร้านค้าเมื่อถูกเลือก
  iconSize: [38, 38],
  iconAnchor: [22, 38],
  popupAnchor: [0, -40],
});

function App() {
  const center = [13.838500199744178, 100.02534412184882];
  const [stores, setStores] = useState([]);
  const [myLocation, setMylocation] = useState({ lat: "", lng: "" });
  const [selectedStore, setSelectedStore] = useState(null);

  const [deliveryZone, setDeliveryZone] = useState({
    lat: null,
    lng: null,
    radius: 1000,
  });

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth radius in meters
    const phi_1 = (lat1 * Math.PI) / 180;
    const phi_2 = (lat2 * Math.PI) / 180;

    const delta_phi = ((lat2 - lat1) * Math.PI) / 180;
    const delta_lambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(delta_phi / 2) * Math.sin(delta_phi / 2) +
      Math.cos(phi_1) *
        Math.cos(phi_2) *
        Math.sin(delta_lambda / 2) *
        Math.sin(delta_lambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${base_url}/api/stores`);
        console.log(response.data);
        if (response.status === 200) {
          setStores(response.data);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };
    fetchStores();
  }, []);

  const handlerGetLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setMylocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  };

  const handleLocationCheck = () => {
    if (!myLocation.lat || !myLocation.lng) {
      Swal.fire({
        title: "Error!",
        text: "Please enter your valid location",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!selectedStore) {
      Swal.fire({
        title: "Error!",
        text: "Please select a store",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const distance = calculateDistance(
      myLocation.lat,
      myLocation.lng,
      selectedStore.lat,
      selectedStore.lng
    );

    if (distance <= deliveryZone.radius) {
      Swal.fire({
        title: "Success",
        text: "You are within the delivery zone for " + selectedStore.name,
        icon: "success",
        confirmButtonText: "OK",
      });
    } else {
      Swal.fire({
        title: "Error!",
        text: "You are outside the delivery zone for " + selectedStore.name,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <>
      <div className="header-container">
        <img
          src="https://cdn-icons-png.flaticon.com/256/12398/12398470.png"
          alt="Logo"
          className="logo"
        />
        <h1>
          <span className="color1">STORE DELIVERY</span>
          <span className="color-red"> ZONE CHECKER</span>
        </h1>
      </div>
      <div className="button-container">
        <button className="get-location-btn" onClick={handlerGetLocation}>
          Get My Location
        </button>
        <button className="get-location-btn" onClick={handleLocationCheck}>
          Check Delivery Availability
        </button>
      </div>

      <div>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "75vh", width: "100vw" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {stores.length > 0 &&
            stores.map((store) => (
              <Marker
                key={store.id}
                position={[store.lat, store.lng]}
                icon={
                  selectedStore && selectedStore.id === store.id
                    ? selectedStoreIcon
                    : storeIcon
                } // เปลี่ยนไอคอนถ้ามีการเลือก
                eventHandlers={{
                  click: () => {
                    setSelectedStore(store); // Set selected store
                  },
                }}
              >
                <Popup>
                  <b>{store.name}</b>
                  <p>{store.address}</p>
                  <p>Delivery Radius: {store.raduis} meters</p>
                  <a href={store.direction}>Get Direction</a>
                </Popup>
              </Marker>
            ))}

          <LocationMap
            myLocation={myLocation}
            icon={houseIcon}
            onLocationSelect={setMylocation}
          />

          {selectedStore && (
            <Marker
              position={[selectedStore.lat, selectedStore.lng]}
              icon={selectedStoreIcon}
            >
              {/* ใช้ selectedStoreIcon */}
              <Popup>
                <b>{selectedStore.name}</b>
                <p>{selectedStore.address}</p>
                <p>Delivery Radius: {selectedStore.radius} meters</p>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </>
  );
}

export default App;
