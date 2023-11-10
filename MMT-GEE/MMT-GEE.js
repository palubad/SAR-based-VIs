var countries = ee.FeatureCollection("USDOS/LSIB/2017"),
    coniferous = ee.FeatureCollection("users/danielp/philab/coniferous_FINAL"),
    deciduous = ee.FeatureCollection("users/danielp/philab/deciduous_FINAL"),
    loss = ee.FeatureCollection("users/danielp/philab/loss_FINAL"),
    loss2021 = ee.FeatureCollection("users/danielp/philab/loss2021");

// set start and end date
var startDate = '2021-01-01',
    endDate =   '2022-01-01';

// Map.addLayer(coniferous)
var ROI = loss2021.limit(600);

// // Map.addLayer(forests)
// var numberOfRandomPoints = 5000; //25000 in 42 seed to have 1020 points in deciduous, 5000 in seed 42 for 1025 points in conifers

// select Czechia
var Czechia = countries.filter(ee.Filter.eq('COUNTRY_NA','Czechia'));
var broadGeometry = Czechia; // geometry to generate random points

var forestType = 111; // for Copernicus Global Land Cover Layers
// 111 conifers, 114 deciduous

var CORINEtype = 312; // for CORINE Land cover
// 312 conifers, 311 deciduous

// set the maximum threshold for single image cloud coverage
var max_clouds = 30;

var listOfOpticalVIs = ['NDVI','NDVIrededge','FAPAR','LAI', 'FAPAR_3b','LAI_3b', 'EVI','NDMI'];
var listOfSARfeatures = ['VV','VH','VV/VH','VH/VV','RVI', 'VDDPI', 'RFDI', 'NRPB', 'angle','LIA',
                        'DPSVInormalized', 'DPSVImodified', 'DPSVIoriginal'
                        ];
var listOfFinalFeatures = ['NDVI','NDVIrededge','FAPAR','LAI', 'FAPAR_3b','LAI_3b', 'EVI','NDMI', 
                          'VV','VH','VV/VH','VH/VV','RVI', 'VDDPI', 'RFDI', 'NRPB', 'angle','LIA',
                          'DPSVInormalized', 'DPSVImodified', 'DPSVIoriginal',
                          'precipitationCurrent', 'precipitation12hours', 'temperature'
                        ];

// add ancillary data
var CoprenicusDEM = ee.ImageCollection("COPERNICUS/DEM/GLO30").select('DEM').filterBounds(Czechia),
    gfc = ee.Image("UMD/hansen/global_forest_change_2022_v1_10"),
    ESAWC = ee.ImageCollection("ESA/WorldCover/v200").first(),
    CGLC = ee.Image("COPERNICUS/Landcover/100m/Proba-V-C3/Global/2019")
            .select('discrete_classification'),
    corine = ee.Image("COPERNICUS/CORINE/V20/100m/2018").select('landcover');

// Calculate aspect and slope from DEM, in radians for further calculations
var slope = CoprenicusDEM.map(function (img){
  return ee.Terrain.slope(img)
}).mosaic().rename('slope');

var dem = CoprenicusDEM.mosaic().rename('DEM');

// Add Sentinel-2 data
var S2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
          .filterBounds(ROI.geometry())
          .filterDate(startDate, endDate)
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',max_clouds))
          // .select(['B2','B3','B4','B5','B6','B7','B8','B11','B12','B8A', 'SCL']);
// print('Original S-2 collection', S2.size());


// Add Sentinel-1 data
var S1Collection = ee.ImageCollection('COPERNICUS/S1_GRD_FLOAT')
                  .filterBounds(ROI.geometry())
                  .filterDate(startDate, endDate)

// Function to add optical vegetation indices (VI)
var addOpticalVI = function(img) {
  var EVI = img.expression(
        '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
            'NIR': img.select('B8').divide(10000),
            'RED': img.select('B4').divide(10000),
            'BLUE': img.select('B2').divide(10000)
        }).rename("EVI")
  
  return img
    .addBands([
                img.normalizedDifference(['B8', 'B4']).rename('NDVI'), 
                img.normalizedDifference(['B8', 'B5']).rename('NDVIrededge'),
                img.normalizedDifference(['B3', 'B8']).rename('NDWI'),
                img.normalizedDifference(['B8', 'B11']).rename('NDMI'),
                EVI
                ]
              );
};

// ================= FAPAR and LAI ================= //
{ 
  /*--------------------------------------------------------------------------------------------------------
This script aims to show Sentinel-2 biophysical parameter retrievals through GEE, based on the 
S2ToolBox methodology.
For algorithm details, see the original ATBD: https://step.esa.int/docs/extra/ATBD_S2ToolBox_L2B_V1.1.pdf

Currently, only FAPAR and LAI (both 3-band and 8-band versions) have been implemented. fCOVER, CCC and CWC can 
be done as well. Input should always be Sentinel-2 L2A products. 

There has been --no-- thorough validation of this code.
Please use at your own risk and provide feedback to:

kristofvantricht@gmail.com
--------------------------------------------------------------------------------------------------------
*/

// Import the biopar module
var biopar = require('users/kristofvantricht/s2_biopar:biopar');

function addFAPARandLAI (img) {
  var FAPAR = biopar.get_fapar(img).rename('FAPAR');
  var LAI = biopar.get_lai(img).rename('LAI');
  var FAPAR_3b = biopar.get_fapar3band(img).rename('FAPAR_3b');
  var LAI_3b = biopar.get_lai3band(img).rename('LAI_3b');
  
  return img.addBands([FAPAR ,LAI,LAI_3b,FAPAR_3b])
}

}

// change linear units to dB
function powerToDb (img){
  return ee.Image(10).multiply(img.log10()).copyProperties(img,img.propertyNames());
}


// Function to add radar indices
var addSARIndices = function(img) {
  var VV = ee.Image(10.0).pow(img.select('VV').divide(10.0)),
      VH = ee.Image(10.0).pow(img.select('VH').divide(10.0));

  var VH_VV = VH.divide(VV).rename('VH/VV');

  var VV_VH = VV.divide(VH).rename('VV/VH');
              
  var RVI = (ee.Image(4).multiply(VH))
            .divide(VV.add(VH)).rename('RVI');
            
  var VDDPI = (VV.add(VH))
             .divide(VV).rename('VDDPI');
             
  var RFDI = (VV.subtract(VH))
              .divide(VV.add(VH)).rename('RFDI'); 

  var NRPB = (VH.subtract(VV))
              .divide(VH.add(VV)).rename('NRPB');
              
  // DPSVIoriginal and DPSVIm adopted from dos Santos et al. (2021) - https://doi.org/10.1080/01431161.2021.1959955
  var max = img.reduceRegion({reducer: ee.Reducer.max(), scale: 20,
                              geometry: broadGeometry, bestEffort: true});

// based on https://www.sciencedirect.com/science/article/pii/S0034425718304140
  var DPSVIoriginal = img.expression(
    'VH * ((VVmax*VH - VV*VH + VH*VH) + (VVmax*VV - VV*VV + VH*VV)) / 1.414213562373095*VV', {
      'VH': img.select('VH'),
      'VV': img.select('VV'),
      'VVmax': ee.Number(max.get('VV'))
  }).rename('DPSVIoriginal');
  
    var DPSVImodified = img.expression(
    '(((VVmax - VV)+VH)/1.414213562373095) * ((VV+VH)/VV) * VH', {
      'VH': img.select('VH'),
      'VV': img.select('VV'),
      'VVmax': ee.Number(max.get('VV'))
  }).rename('DPSVImodified');
  
  var DPSVInormalized = img.expression(
    '(VV*VV+VV*VH)/1.414213562373095',{
      'VH': img.select('VH'),
      'VV': img.select('VV')
  }).rename('DPSVInormalized');
  
  return img.addBands([RVI, VDDPI, RFDI, NRPB,VH_VV,VV_VH,
                       DPSVInormalized, DPSVImodified, DPSVIoriginal
                       ]);
};

//////////////////////////////// S2CLOUDLESS ////////////////////////////////
{
//Predefined parameters
var CLOUD_FILTER = max_clouds; //filter out images having higher cloudiness than set
var CLD_PRB_THRESH = 50;
var NIR_DRK_THRESH = 0.15;
var CLD_PRJ_DIST = 1;
var BUFFER = 55;

//Load S2 cloud probability collection
var s2_cloudless_col = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
                      .filterDate(startDate, endDate)
                      .filterBounds(ROI.geometry())      

//Load S2 collection
var filtered = S2.filterDate(startDate, endDate)
              .filterBounds(ROI.geometry())
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',CLOUD_FILTER));

//Join the collections 
var joinedColl = ee.ImageCollection(ee.Join.saveFirst('s2cloudless').apply
({'primary': filtered,
    'secondary': s2_cloudless_col,
    'condition': ee.Filter.equals({
    'leftField': 'system:index',
    'rightField': 'system:index'
    })
  }));
// print('Joined collection:',col);

//Define cloud mask functions
function add_cloud_bands(img){
  //Get s2cloudless image, subset the probability band.
  var cld_prb = ee.Image(img.get('s2cloudless')).select('probability');
  var origoCLDMSK = img.select('MSK_CLDPRB').gt(5).rename('origo');
  
  //Condition s2cloudless by the probability threshold value.
  var is_cloud = cld_prb.gt(CLD_PRB_THRESH).add(origoCLDMSK).rename('clouds');
  
  
  //Add the cloud probability layer and cloud mask as image bands.
  return img.addBands(ee.Image([cld_prb, is_cloud,origoCLDMSK]));
}  

function add_shadow_bands(img){
  //Identify water pixels from the SCL band.
  var not_water = img.select('SCL').neq(6);
  
  //Identify dark NIR pixels that are not water (potential cloud shadow pixels).
  var SR_BAND_SCALE = 1e4;
  var dark_pixels = img.select('B8').lt(NIR_DRK_THRESH*SR_BAND_SCALE).multiply(not_water).rename('dark_pixels');
  
  //Determine the direction to project cloud shadow from clouds (assumes UTM projection).
  var shadow_azimuth = ee.Number(90).subtract(ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE')));
  
  //Project shadows from clouds for the distance specified by the CLD_PRJ_DIST input.
  var cld_proj = img.select('clouds').directionalDistanceTransform(shadow_azimuth, CLD_PRJ_DIST*10)
  .reproject({'crs': img.select(0).projection(), 'scale': 20})
  .select('distance')
  .mask()
  .rename('cloud_transform');

  //Identify the intersection of dark pixels with cloud shadow projection.
  var shadows = cld_proj.multiply(dark_pixels).rename('shadows');

  //Add dark pixels, cloud projection, and identified shadows as image bands.
  return img.addBands(ee.Image([dark_pixels, cld_proj, shadows]));
}

function add_cld_shdw_mask(img){
  //Add cloud component bands.
  var img_cloud = add_cloud_bands(img);

  //Add cloud shadow component bands.
  var img_cloud_shadow = add_shadow_bands(img_cloud);

  //Combine cloud and shadow mask, set cloud and shadow as value 1, else 0.
  var is_cld_shdw0 = img_cloud_shadow.select('clouds').add(img_cloud_shadow.select('shadows')).gt(0);

  //Remove small cloud-shadow patches and dilate remaining pixels by BUFFER input.
  //20 m scale is for speed, and assumes clouds don't require 10 m precision.
  var is_cld_shdw = is_cld_shdw0.focal_min(2).focal_max(BUFFER*2/20)
  .reproject({'crs': img.select([0]).projection(), 'scale': 20})
  .rename('cloudmask');

  //Add the final cloud-shadow mask to the image.
  // return img_cloud_shadow.addBands(is_cld_shdw);
  return img.addBands(is_cld_shdw).updateMask(is_cld_shdw.eq(0));
}
}


var S2_cloudMasked = joinedColl.map(add_cld_shdw_mask);

var original = ee.Image(filtered.toList(filtered.size()).get(20));

function S2fullMask (img) {
  var withSnowMask = img.updateMask(img.select('MSK_SNWPRB').gt(5).eq(0))
                              .updateMask(img.select('SCL').eq(11).eq(0));
  var S2FullMasked = withSnowMask.updateMask(img.select('SCL').eq(1).eq(0))
                                .updateMask(img.select('SCL').eq(2).eq(0))
                                .updateMask(img.select('SCL').eq(3).eq(0))
                                .updateMask(img.select('SCL').eq(7).eq(0))
                                .updateMask(img.select('SCL').eq(8).eq(0))
                                .updateMask(img.select('SCL').eq(9).eq(0))
                                .updateMask(img.select('SCL').eq(10).eq(0));
  return S2FullMasked
}

function QA60Mask (image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

// Add optical and SAR indices to the data
var S2 = S2_cloudMasked.map(addOpticalVI).map(addFAPARandLAI).select(listOfOpticalVIs);
var S2 = S2_cloudMasked
                      .map(S2fullMask)//.map(function(img){return img.unmask(-9999999999)})
                      // .map(QA60Mask)
                      .map(addOpticalVI)
                      .map(addFAPARandLAI)
                      .select(listOfOpticalVIs)
print(S2, 'S2')

// ========================================================================================
// =========================== Add weather information  ===================================
// ========================================================================================
// load the ERA5 dataset
var ERA5 = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
                .filterDate(startDate, endDate);

// function to add sums of precipitation for previous 3 and 12 hours
var addweatherData = function (img) {

  var startDateLast12hours = ee.Date(ee.Number.parse(img.get('system:time_start'))
                                .subtract(43200000)).format();
                                // 43 200 000 (12 hours in miliseconds)
  
  var endDate = ee.Date(ee.Number.parse(img.get('system:time_start'))
                  .add(3600000)).format();
                  // add one hour to include values from the sensing time, too
                  // 3 600 000 (1 hour in milisenconds)
  
  var currentDate = ee.Date(img.get('system:time_start')).format();
  
  // filter out ERA5-Land data
  var precipitation12hours = ERA5.select('total_precipitation_hourly')
                      .filterDate(startDateLast12hours, endDate)
                      .sum().multiply(1000) // in mm
                      .rename('precipitation12hours');

  var temperature = ERA5.select('temperature_2m')
    .filterDate(currentDate, endDate).first().subtract(ee.Image(273.15)).rename('temperature');
  var snowCover = ERA5.select('snow_cover')
    .filterDate(currentDate, endDate).first().rename('snow_cover');
  var precipitationCurrent = ERA5.select('total_precipitation_hourly')
    .filterDate(currentDate, endDate).first().multiply(1000) // in mm
    .rename('precipitationCurrent');
  
  return img.addBands([precipitation12hours.clip(img.geometry()), 
  temperature.clip(img.geometry()), precipitationCurrent.clip(img.geometry())]);
};

// Map.addLayer(ee.Image('COPERNICUS/S1_GRD_FLOAT/S1A_IW_GRDH_1SDV_20211009T164335_20211009T164400_040045_04BD96_B962'),{},'s1')
S1Collection = S1Collection
              // add DEM information
              .map(function (img){
                return img.addBands([dem.clip(img.geometry()),slope.clip(img.geometry())])
              })
              // add weather data
              .map(addweatherData);

// =================================== JOIN THE COLLECTIONS ======================= //

function join_S1_S2 (image) {
  var s1_selected = image;
  var s1_date = s1_selected.get('system:time_start');
  var s2_byDate = S2.filterDate(ee.Date(s1_date).advance(-1, 'day'),
                                ee.Date(s1_date).advance(1, 'day'));
  var s2_byArea = s2_byDate.filterBounds(s1_selected.geometry());

  // save S2 ID property
  var s2_selected = s2_byArea.mosaic();
  
  // add the size of S2 collection
  var s2_size = s2_byArea.size()
  
  var final = s1_selected.addBands(s2_selected).setMulti({
  s2_size: s2_size
  });
  
  return ee.Image(final)
}

var joined_all = S1Collection.map(join_S1_S2);

// print(joined_all, 'joined_all');

// Filter out lonely S1 images
var joined = ee.ImageCollection(joined_all).filter(ee.Filter.gt('s2_size',0));
print(joined, 'joined');

// ============================================================================
// ======================= ADD LIA  ==================================
// ============================================================================

// Add Local Incidence Angle (LIA) from Copernicus DEM
// call the addLIA function 
var addLIA = require('users/danielp/functions:addLIA');
var joined = addLIA.addLIA(joined,Czechia);

// ============================================================================
// ======================= SPECKLE FILTERING ==================================
// ============================================================================

var KERNEL_SIZE = 5; // for 5x5 filter

var leefilter = function(image) {
//---------------------------------------------------------------------------//
// Lee filter 
//---------------------------------------------------------------------------//
/** Lee Filter applied to one image. It is implemented as described in 
 J. S. Lee, “Digital image enhancement and noise filtering by use of local statistics,” 
 IEEE Pattern Anal. Machine Intell., vol. PAMI-2, pp. 165–168, Mar. 1980.*/
 
        var bandNames = ['VV','VH'];
        //S1-GRD images are multilooked 5 times in range
        var enl = 5
        // Compute the speckle standard deviation
        var eta = 1.0/Math.sqrt(enl); 
        eta = ee.Image.constant(eta);

        // MMSE estimator
        // Neighbourhood mean and variance
        var oneImg = ee.Image.constant(1);

        var reducers = ee.Reducer.mean().combine({
                      reducer2: ee.Reducer.variance(),
                      sharedInputs: true
                      });
        var stats = image.select(bandNames).reduceNeighborhood({reducer: reducers,kernel: ee.Kernel.square(KERNEL_SIZE/2,'pixels'), optimization: 'window'})
        var meanBand = bandNames.map(function(bandName){return ee.String(bandName).cat('_mean')});
        var varBand = bandNames.map(function(bandName){return ee.String(bandName).cat('_variance')});
        
        var z_bar = stats.select(meanBand);
        var varz = stats.select(varBand);

        // Estimate weight 
        var varx = (varz.subtract(z_bar.pow(2).multiply(eta.pow(2)))).divide(oneImg.add(eta.pow(2)));
        var b = varx.divide(varz);
  
        //if b is negative set it to zero
        var new_b = b.where(b.lt(0), 0)
        var output = oneImg.subtract(new_b).multiply(z_bar.abs()).add(new_b.multiply(image.select(bandNames)));
        output = output.rename(bandNames);
        return image.addBands(output, null, true);
  }   

// Do the job
var speckle_filtered_joined = joined.map(leefilter);

// Boxcar filter
function multilooking(img){
  var multilooked = img.select(['VV','VH']).reduceNeighborhood({
    reducer: ee.Reducer.mean(),
    kernel: ee.Kernel.square(KERNEL_SIZE/2)
    }).rename(['VV','VH']);
    
  return img.addBands(multilooked, null, true);
}  

// // Do the job for 
// // uncomment for multilooking
// var speckle_filtered_joined = joined.map(multilooking);

// ============================================================================
// ============================== LC-SLIAC ====================================
// ============================================================================

// call the LC-SLIAC_global function 
var LC_SLIAC_global = require('users/danielp/phi-lab:final/LC-SLIAC_global_v2_oneLCtype_ESAworldCover');

// Apply the LIA Correction function
var CorrectedCollection = LC_SLIAC_global.LC_SLIAC_global(
    Czechia.geometry(),
    startDate,
    endDate,
    10, // Forests
    speckle_filtered_joined
);


// change linear units to dB
function powerToDb_Speckled (img){
  return img.addBands(ee.Image(10).multiply(img.select(['VV','VH']).log10()).rename(['VV','VH']),null,true)
}

var corrected_joined = speckle_filtered_joined.map(addSARIndices).map(powerToDb_Speckled)//.select(listOfFinalFeatures)
print(corrected_joined)

var getData = corrected_joined.map(function(img){
    return img.reduceRegions({collection: ROI, reducer: ee.Reducer.mean(), scale: 20});
  });

var to_export = getData.flatten().filter(ee.Filter.notNull(['LAI','VH'])).filter(ee.Filter.neq('LAI',0)).filter(ee.Filter.neq('DEM',0));
print(to_export)

// export
Export.table.toDrive({
    collection: to_export,
    description: 'Multiple_Locations_time_series',
    folder: 'phi-lab-tests',
    fileNamePrefix: 'Multiple_Locations_time_series',
    fileFormat: 'CSV'
});








// JUST ONE POINT FOR VALIDATION OF TS
var deciduous_point = ee.Geometry.Point([14.172958485407266,49.9577622055273]);
var evergreen_point = ee.Geometry.Point([14.826471541984496,49.79316469263443]);
var evergreen_point2 = ee.Geometry.Point([14.457397037020527,50.44805205669623]);
var loss1 = ee.Geometry.Point([15.111915087246668,49.824023512358444]);
var loss2 = ee.Geometry.Point([15.41255025225252,49.422133147718384]);
var fos = ee.Geometry.Point([17.81959806559152,49.34443248398086]); 
var loss3 = ee.Geometry.Point([15.515598972689373,49.3507118017801]);
// Map.addLayer(loss1_point)

// Select which sample point to use
var selected = loss1;

var buffered_selected = selected.buffer(20).bounds();

// get data for each point in each time step
var S1export_one_point = addLIA.addLIA(S1Collection,Czechia).map(leefilter).map(addSARIndices).map(powerToDb_Speckled)
                        .filterBounds(buffered_selected).map(function(img){
                        return img.reduceRegions({collection: buffered_selected, reducer: ee.Reducer.mean(), scale: 20})
                      }).flatten().filter(ee.Filter.notNull(['VH']));

// export just one test point
Export.table.toDrive({
    collection: S1export_one_point,
    description: 'S1_OnePoint_',
    folder: 'phi-lab-tests',
    fileNamePrefix: 'S1_OnePoint_',
    fileFormat: 'CSV'
});

// get data for each point in each time step
var S2export_one_point = S2.filterBounds(buffered_selected).map(function(img){
    return img.reduceRegions({collection: buffered_selected, reducer: ee.Reducer.mean(), scale: 20})
  }).flatten().filter(ee.Filter.notNull(['LAI']));

print(S2export_one_point)

// export just one test point
Export.table.toDrive({
    collection: S2export_one_point,
    description: 'S2_OnePoint_',
    folder: 'phi-lab-tests',
    fileNamePrefix: 'S2_OnePoint_',
    fileFormat: 'CSV'
});
