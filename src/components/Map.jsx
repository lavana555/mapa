import "./Map.styl"

import React, { Component }         from "react"
import { Map, TileLayer, Marker, CircleMarker, Circle }   from "react-leaflet"
import { icons }                    from "vm-leaflet-icons"
import URLs                         from "../constants/URLs"
import { pure }                     from "recompose"
import { NAMES, CSS_CLASSES, IDS }  from  "../constants/Categories"
import COLORS                       from "./styling/Colors"
import { avg_rating_for_entry }     from "../rating"
import styled                       from "styled-components";


const { INITIATIVE, EVENT, COMPANY } = IDS;

const LocateButton = styled.a `
  position: absolute;
  z-index: 1;
  right: 10px;
  bottom: 88px;
  border-radius: 4px;
  background-color: #f4f4f4;
  width: 26px;
  height: 26px;
  text-align: center;
  line-height: 26px;
  cursor: pointer !important;
  box-shadow: 0 1px 5px rgba(0,0,0,0.65);
  font-size: 14px;
  color: #333;
`;

class KVMMap extends Component {

  getIconById(id){
    switch (id) {
      case INITIATIVE:
        return icons.initiative;
      case EVENT:
        return icons.event;
      case COMPANY:
        return icons.company;
      default:
        return icons.unknown;
    }
  }

  getCategoryColorById(id){
    switch (id) {
      case INITIATIVE:
        return COLORS.initiative;
      case EVENT: 
        return COLORS.event;
      case COMPANY:
        return COLORS.company;
      default:
        return COLORS.otherCategory;
    }
  }

  componentDidMount(){
    //workaround due to a bug in react-leaflet:
    const map = this.refs.map;
    if (map) {
      map.fireLeafletEvent('load', map)
      map.leafletElement.addControl(L.control.zoom({position: 'bottomright'}))
      this.props.onMoveend(this.getMapCoordinates())
    }
  }

  componentDidUpdate(prevProps, prevState){
    if (prevProps.size != this.props.size) {
      this.refs.map.leafletElement.invalidateSize()
    }
  }

  getMapCoordinates(){
    const m = this.refs.map.leafletElement
    return {
      center: m.getCenter(),
      bbox  : m.getBounds(),
      zoom  : m.getZoom()
    }
  }

  render() {

    var markers = [];

    const {
      entries,
      center,
      zoom,
      marker,
      highlight,
      onMoveend,
      onZoomend,
      onClick,
      onMarkerClick,
      ratings
    } = this.props;


    if (entries && entries.length > 0 ) {
      entries.forEach(e => {
        let avg_rating = null;

        if(e.ratings.length > 0 && Object.keys(ratings).length > 0){
          const ratings_for_entry = (e.ratings || []).map(id => ratings[id]);
          avg_rating = avg_rating_for_entry(ratings_for_entry);
        }

        if(e.ratings.length > 0 && avg_rating && avg_rating > 0){
          markers.push(
            <Marker
              key       = { e.id }
              onClick   = { () => { onMarkerClick(e.id) }}
              position  = {{ lat: e.lat, lng: e.lng }}
              icon      = { this.getIconById(e.categories[0]) }
            />
          );
        } else {
          markers.push(
          // to make clicking the circle easier add a larger circle with 0 opacity:
            <CircleMarker
              onClick   = { () => { onMarkerClick(e.id) }}
              key       = { e.id + "-overlay"}
              center    = {{ lat: e.lat, lng: e.lng }}
              opacity   = { 1 }
              radius    = { 10 }
              weight    = { 0 }
              fillColor = { this.getCategoryColorById(e.categories[0]) }
              fillOpacity = { 0.0 }
              />
            );
          markers.push(
            <CircleMarker
              onClick   = { () => { onMarkerClick(e.id) }}
              key       = { e.id }
              center    = {{ lat: e.lat, lng: e.lng }}
              opacity   = { 1 }
              radius    = { 5 }
              color     = { "#555" }
              weight    = { 0.7 }
              fillColor = { this.getCategoryColorById(e.categories[0]) }
              fillOpacity = { 1.0 }
              />);
        }

        if(highlight.length > 0 && highlight.indexOf(e.id) == 0){
          markers.push(
            <CircleMarker
              onClick   = { () => { onMarkerClick(e.id) }}
              key       = { e.id + "-highlight"}
              center    = {{ lat: e.lat, lng: e.lng }}
              opacity   = { 1 }
              radius    = { 5.5 }
              color     = { "#000" }
              fillColor = { this.getCategoryColorById(e.categories[0]) }
              weight    = { 2.5 }
              fillOpacity = { 1 }
          />);
        }
      })
    }

    return (
        <div>
        <Map
        style = {{
          height:   "100%",
          width:    "100%",
          position: "absolute",
          margin:   0,
          zIndex:   0,
          padding:  0,
          top:      0,
          left:     0
        }}
        ref         = 'map'
        center      = { center }
        zoom        = { zoom   }
        zoomSnap    = { 0.0 }
        zoomControl = { false }
        className   = "map"
        onMoveend   = { (e) => { onMoveend(this.getMapCoordinates()) }}
        onZoomend   = { (e) => { onZoomend(this.getMapCoordinates()) }}
        onClick     = { (e) => { onClick(e.latlng) }} >

          <TileLayer
            url = { URLs.OSM_TILES.link }
            attribution = {
              '&copy; <a class="osm attr" href=' +
               URLs.OSM_ATTR.link + '>' + URLs.OSM_ATTR.name + '</a>' } >
          </TileLayer>
          { markers }
          { marker
            ? <Marker position = { marker } icon = { this.getIconById(parseInt(this.props.category)) } />
            : null
          }
          }
        </Map>
        <LocateButton
          className   = "locate-icon"
          onClick     = { this.props.onLocate }
          title       = "Zeige meine Position" >
          <i className = "fa fa-location-arrow" />
        </LocateButton>
        </div>)
    }
}

const T = React.PropTypes;

KVMMap.propTypes = {
    entries       : T.array,
    ratings       : T.object,
    highlight     : T.array,
    center        : T.object,
    zoom          : T.number,
    marker        : T.object,
    onClick       : T.func,
    onMoveend     : T.func,
    onZoomend     : T.func,
    onMarkerClick : T.func,
    onLocate      : T.func
};

module.exports = pure(KVMMap);