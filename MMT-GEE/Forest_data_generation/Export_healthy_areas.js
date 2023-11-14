// set start and end date
var startDate = '2021-01-01',
    endDate = '2022-01-01';

var numberOfPoints = 5000; 
// for deciduous, set 25000 in 42 seed to have 1020 points 
// for coniferous, set 5000 in seed 42 for 1025 points

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




// Create a forest mask for data
// Select pixels with >30% tree cover and mask out region with forest loss
var GFC = gfc.select("treecover2000").updateMask(gfc.select("treecover2000").gte(30));

// Hansen Global forest - Select areas with forest loss from 2000 until 2021
var maskedLoss = (gfc.select('lossyear').unmask().lt(1)).or(gfc.select('lossyear').unmask().gt(21));

var maskedGFC = GFC.updateMask(maskedLoss);

// Load the ESA WorldCover Layers and use only the selected land cover type
var ESAWC_forest = ESAWC.updateMask(ESAWC.eq(10));

// // Load the Copernicus Global Land Cover Layers and use only the selected land cover type
var CGLC_type = CGLC.updateMask(CGLC.eq(forestType));

// set forest type in CORINE
var corine_type = corine.updateMask(corine.eq(CORINEtype));

// Create an intersection of these two land cover databases
// var CopernicusAndHansenAndESA = ESAWC_forest.updateMask(maskedGFC).updateMask(CGLC_type);
var CORINEAndHansenAndESA = ESAWC_forest.updateMask(maskedGFC).updateMask(corine_type);
var CORINEAndHansenAndESAandCopernicus = CORINEAndHansenAndESA.updateMask(CGLC_type);

// Map.addLayer(CopernicusAndHansenAndESA, {}, 'all combined with Coernicus')
// Map.addLayer(ESAWC_forest, {}, 'ESAWC_forest')
// Map.addLayer(CGLC_type, {}, 'Copernicus')

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

var healthy_treePoints = calculatedPoints.filter(ee.Filter.eq('mean', CORINEtype));
print(healthy_treePoints.size(),'healthy_treePoints');

// Export data to csv
Export.table.toAsset({collection: healthy_treePoints,
                      description: 'healthy_treePoints'
                    });
