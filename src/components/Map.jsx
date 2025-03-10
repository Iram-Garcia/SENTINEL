import React from 'react'
import { cn } from "../utils"
import { MapContainer } from 'react-leaflet/MapContainer'
import { TileLayer } from 'react-leaflet/TileLayer'
import { Marker, Popup, LayersControl, ZoomControl, ScaleControl, FeatureGroup } from 'react-leaflet'
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react"
import { createSwapy } from 'swapy'
import { useMap } from 'react-leaflet/hooks'
import { useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import MarkerClusterGroup from 'react-leaflet-cluster'

// For the drawing functionality, we'll have a conditional import
let EditControl = null;
try {
  // Optional import for drawing functionality
  const ReactLeafletDraw = require('react-leaflet-draw');
  EditControl = ReactLeafletDraw.EditControl;
} catch (err) {
  console.warn("react-leaflet-draw not installed. Drawing features will be disabled.");
}

const MapInvalidator = forwardRef((props, ref) => {
    const map = useMap();

    const mapEvents = useMapEvents({
        zoomend: () => {
            props.setZoomLevel(mapEvents.getZoom());
        },
        moveend: () => {
            const center = mapEvents.getCenter();
            props.setPosition([center.lat, center.lng]);
        }
    });

    useImperativeHandle(ref, () => ({
        update() {
            map.invalidateSize();
        }
    }));

    useEffect(() => {
        map.invalidateSize();
    }, [map]);

    return null;
});

function Map({ 
    markers, 
    enableDraw = false, 
    enableClustering = true, 
    mapStyle = 'light',
    showControls = true 
}) {
    const mapRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(13);
    const [position, setPosition] = useState([32.9901482, -106.9750699, 947]);
    const [swaping, setSwaping] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);
    const [drawnItems, setDrawnItems] = useState([]);

    // Only show drawing tools if EditControl exists and enableDraw is true
    const showDrawingTools = enableDraw && EditControl !== null;

    // Map tile styles
    const mapStyles = {
        light: {
            url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: ['a', 'b', 'c', 'd']  // Explicitly set subdomains for all styles
        },
        dark: {
            url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: ['a', 'b', 'c', 'd']
        },
        satellite: {
            // Use a more reliable satellite imagery source
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            // No subdomains needed for this provider
        },
        terrain: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            subdomains: ['a', 'b', 'c']
        },
        // Add a fallback option that's very reliable
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: ['a', 'b', 'c']
        }
    };

    const handleDrawCreated = (e) => {
        if (!enableDraw) return;
        const { layerType, layer } = e;
        setDrawnItems(prev => [...prev, { type: layerType, geoJSON: layer.toGeoJSON() }]);
    };

    useEffect(() => {
        const container = document.getElementById('main')

        const swapy = createSwapy(container, {
            animation: 'dynamic',
            preserveAspectRatio: true
        })

        swapy.onSwapEnd((event) => {
            setSwaping(false)
            mapRef.current.update()
            setHasChanged(prev => !prev)
        });

        swapy.onSwapStart(() => {
            setSwaping(true)
        });

        const style = document.createElement('style')
        style.innerHTML = `
          [data-swapy-item] {
            transition: none !important;
            width: 100% !important;
            height: 100% !important;
          }
          [data-swapy-ghost] {
            transition: none !important;
            width: var(--swapy-width) !important;
            height: var(--swapy-height) !important;
          }
          .leaflet-container {
            width: 100% !important;
            height: 100% !important;
          }
        `
        document.head.appendChild(style)

        swapy.enable(true)

        return () => {
            swapy.enable(false)
            style.remove()
        }
    }, [])

    return (
        <div className="flex-1 min-w-0" data-swapy-slot="1">
            <div data-swapy-item="a" className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm">
                <div className="w-full bg-[#09090B] flex items-center py-1 px-2 border-b-2 border-[#201F1F] drag-handle cursor-move select-none" data-swapy-handle>
                    <p className="text-[#9CA3AF] text-lg">Map</p>
                </div>
                <div className="flex-1 overflow-hidden flex">
                    <div className={cn("flex justify-center items-center flex-1", {
                        "hidden": !swaping
                    })}>
                        <h2 className="text-[#9CA3AF] text-lg">Map is hidden while swapping...</h2>
                    </div>

                    <div className={cn("flex-1", {
                        "hidden": swaping
                    })}>
                        <MapContainer
                            center={position}
                            zoom={zoomLevel}
                            scrollWheelZoom={true}
                            className="w-full h-full"
                            key={hasChanged}
                            attributionControl={false}
                            zoomControl={false}
                        >
                            <MapInvalidator ref={mapRef} setZoomLevel={setZoomLevel} setPosition={setPosition} />
                            
                            {showControls && (
                                <>
                                    <ZoomControl position="bottomright" />
                                    <ScaleControl position="bottomleft" />
                                </>
                            )}
                            
                            <LayersControl position="topright">
                                {Object.entries(mapStyles).map(([styleName, style]) => (
                                    <LayersControl.BaseLayer 
                                        key={styleName} 
                                        checked={styleName === mapStyle} 
                                        name={styleName.charAt(0).toUpperCase() + styleName.slice(1)}
                                    >
                                        <TileLayer
                                            attribution={style.attribution}
                                            url={style.url}
                                            subdomains={style.subdomains}
                                            // Add error handling for tile loading
                                            eventHandlers={{
                                                tileerror: (error) => {
                                                    console.warn('Tile loading error:', error);
                                                }
                                            }}
                                        />
                                    </LayersControl.BaseLayer>
                                ))}
                            </LayersControl>
                            
                            {/* Fallback base layer in case others fail */}
                            {mapStyle === 'satellite' && (
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap contributors"
                                    subdomains={['a', 'b', 'c']}
                                    opacity={0}
                                    zIndex={-10}
                                />
                            )}
                            
                            {showDrawingTools && (
                                <FeatureGroup>
                                    <EditControl
                                        position="topleft"
                                        onCreated={handleDrawCreated}
                                        draw={{
                                            rectangle: true,
                                            polyline: true,
                                            polygon: true,
                                            circle: true,
                                            marker: true,
                                        }}
                                    />
                                </FeatureGroup>
                            )}
                            
                            {enableClustering ? (
                                <MarkerClusterGroup chunkedLoading>
                                    {markers.map((marker) => (
                                        <Marker key={marker.id} position={marker.position}>
                                            <Popup>
                                                <div className="popup-content">
                                                    <h3 className="font-bold">{marker.title || `Marker ${marker.id}`}</h3>
                                                    {marker.description && <p>{marker.description}</p>}
                                                    {marker.timestamp && <p className="text-sm text-gray-500">
                                                        {new Date(marker.timestamp).toLocaleString()}
                                                    </p>}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MarkerClusterGroup>
                            ) : (
                                markers.map((marker) => (
                                    <Marker key={marker.id} position={marker.position}>
                                        <Popup>
                                            <div className="popup-content">
                                                <h3 className="font-bold">{marker.title || `Marker ${marker.id}`}</h3>
                                                {marker.description && <p>{marker.description}</p>}
                                                {marker.timestamp && <p className="text-sm text-gray-500">
                                                    {new Date(marker.timestamp).toLocaleString()}
                                                </p>}
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))
                            )}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Map