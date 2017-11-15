const express = require('express');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const {db} = require('../db/sequelize');
const {offsetLatLonByMeters, parseLocationParameters} = require('./geo');

const router = express.Router();

const anchorListLimit = 200

/* Get a list of nearby Anchors */
router.get('/', (request, response, next) => {
  const locationParams = parseLocationParameters(request.query)
  if(locationParams){
    var anchorQuery = findAnchorsByLocation(locationParams.latitude, locationParams.longitude, locationParams.radius)
  } else {
    var anchorQuery = db.Anchor.findAll({ limit: anchorListLimit })
  }
  anchorQuery.then(data => {
    response.status(200).json(data)
  }).catch(err => {
    console.log('err', err)
    res.status(500).send({
      error: err
    });
    return
  })
});

module.exports = router;

/*
For simplicity, find anchors within a square of side 2*radius around the lat/lon.
*/
function findAnchorsByLocation(latitude, longitude, radius, response){
  const northWestCorner = offsetLatLonByMeters(latitude, longitude, -radius, -radius)
  const southEastCorner = offsetLatLonByMeters(latitude, longitude, radius, radius)
  let sortedLatitude = [northWestCorner.latitude, southEastCorner.latitude]
  sortedLatitude.sort(function(a,b){return a - b})
  let sortedLongitude = [northWestCorner.longitude, southEastCorner.longitude]
  sortedLongitude.sort(function(a,b){return a - b})
  return db.Anchor.findAll({
    limit: anchorListLimit,
    where: {
      [Op.and]: [
        { 
          latitude: {
            [Op.between]: sortedLatitude
          } 
        },
        {
          longitude: {
            [Op.between]: sortedLongitude
          } 
        }
      ]
    }    
  })
}
