// set start and end date
var startDate = '2021-01-01',
    endDate = '2022-01-01';

var numberOfPoints = 300000;
 
// select Czechia
var countries = ee.FeatureCollection("USDOS/LSIB/2017");
var Czechia = countries.filter(ee.Filter.eq('COUNTRY_NA','Czechia')).geometry();
var broadGeometry = Czechia; // geometry to generate random points

Map.addLayer(Czechia)

var forestType = 111; // for Copernicus Global Land Cover Layers

var CORINEtype = 312; // for CORINE Land cover

// add ancillary data
var CoprenicusDEM = ee.ImageCollection("COPERNICUS/DEM/GLO30").select('DEM').filterBounds(Czechia),
    gfc = ee.Image("UMD/hansen/global_forest_change_2021_v1_9"),
    ESAWC = ee.ImageCollection("ESA/WorldCover/v200").first(),
    CGLC = ee.Image("COPERNICUS/Landcover/100m/Proba-V-C3/Global/2019")
            .select('discrete_classification'),
    corine = ee.Image("COPERNICUS/CORINE/V20/100m/2018").select('landcover');

// Calculate aspect and slope from DEM, in radians for further calculations
var slope = CoprenicusDEM.map(function (img){
  return ee.Terrain.slope(img)
}).mosaic().rename('slope');

var dem = CoprenicusDEM.mosaic().rename('DEM');

// Hansen Global forest - Select areas with forest loss from 2000 until 2021
var maskedLoss = gfc.select('lossyear').eq(21).unmask();
Map.addLayer(maskedLoss, {}, 'loss21')

Map.addLayer(gfc.select('lossyear').unmask().clip(Czechia),{},'loss')

var maskedGFC = gfc.select('lossyear').gte(18).unmask();
// Map.addLayer(maskedGFC)
// Load the ESA WorldCover Layers and use only the selected land cover type
var ESAWC_forest = ESAWC.updateMask(ESAWC.eq(10));

// // Load the Copernicus Global Land Cover Layers and use only the selected land cover type
var CGLC_type = CGLC.updateMask(CGLC.eq(forestType));

// set forest type in CORINE
var corine_type = corine.updateMask(corine.eq(CORINEtype));

// Create an intersection of these two land cover databases
// var CopernicusAndHansenAndESA = ESAWC_forest.updateMask(maskedGFC).updateMask(CGLC_type);
var CORINEAndHansenAndESA = corine_type.updateMask(maskedLoss).updateMask(CGLC_type)//.updateMask(corine_type);
var CORINEAndHansenAndESAandCopernicus = CORINEAndHansenAndESA;

var points = CORINEAndHansenAndESAandCopernicus.sample({
                                    region:Czechia, 
                                    scale:20,
                                    factor: 0.005,
                                    geometries: true
})

// Map.addLayer(CopernicusAndHansenAndESA, {}, 'all combined with Coernicus')
Map.addLayer(CORINEAndHansenAndESAandCopernicus.clip(Czechia), {}, 'all combined CORINEAndHansenAndESAandCopernicus');

var calculatedPoints = CORINEAndHansenAndESAandCopernicus.unmask().reduceRegions({
                          collection: points.map(function(point){
                            return point.buffer(20).bounds();
                          }),
                          reducer: ee.Reducer.mean(),
                          scale: 20,
                      });

var dead_treePoints = calculatedPoints.filter(ee.Filter.eq('mean', CORINEtype));
print(dead_treePoints.size(),'dead_treePoints');

// Export data to csv
Export.table.toAsset({collection: dead_treePoints,
                      description: 'Export_forest_areas'
                    });
