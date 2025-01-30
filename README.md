# 🌲🌳 Supplementary data and ML models to estimate SAR-based Vegetation indices and biophysical variables for forest ecosystems [in Central Europe]

This study presents a machine learning-based approach to estimate optical vegetation indices and biophysical variables (hereafter referred to as VIs) using synthetic aperture radar (SAR) and ancillary data for forest monitoring. 
The best-performing models were Random Forest Regressor (RFR) for LAI and FAPAR and XGBoost (XGB) for EVI and NDVI - these models are available in this repository. These models were trained on temporally and spatially aligned time series (TS) datasets, containing Sentinel-1 SAR data, Sentinel-2 multispectral data, DEM-based features and meteorological variables. It provides an accurate and timely alternative to optical-based VIs.

This repository is part of the following paper: 
> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2025): Estimating vegetation indices and biophysical parameters for Central European temperate forests with Sentinel-1 SAR data and machine learning. Published in Big Earth Data

![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/3rueSUVk9bOqsFy4fsD-7.png)
Figure 1. Methodology used in the paper.

## 💾 The best found ML models can be found on [HuggingFace🤗](https://huggingface.co/palubad/SAR-based-VIs).

## ⚙️ Details

The study explores the feasibility of using SAR-based features in combination with additional datasets (e.g., DEM-based features and meteorological data) to estimate optical VIs, specifically, LAI, FAPAR, EVI and NDVI. Traditional optical remote sensing methods are often hindered by cloud cover, making it difficult to obtain continuous and reliable vegetation monitoring data. This research addresses this challenge by applying SAR data, which is unaffected by atmospheric conditions.
Using ML, particularly RFR and XGB, the study demonstrates that SAR-based VIs can replicate the patterns of optical-based VIs, while also offering advantages such as higher temporal resolution and all-year monitoring. The inclusion of ancillary data improves model accuracy, particularly in differentiating forest types and seasonal variations. The transferability tests confirm that the methodology generalizes well across Central European forests and shows potential for large-scale monitoring applications.

- **Developed by:** Daniel Paluba & Bertrand Le Saux
- **License:** CC BY 4.0

### 🔗 Other resources

- [MMTS-GEE](https://github.com/palubad/MMTS-GEE) to generate multi-modal and time series datasets with spatially and temporally aligned data.
> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2024): Identification of Optimal Sentinel-1 SAR Polarimetric Parameters for Forest Monitoring in Czechia. AUC Geographica 59(2), 1–15, DOI: [10.14712/23361980.2024.18](https://doi.org/10.14712/23361980.2024.18).


**Demo:**
  Will be provided soon.

## 🛠 How to Get Started with the Model

To implement this model:
- Prepare input datasets using the [MMTS-GEE tool](https://github.com/palubad/MMTS-GEE): Collect Sentinel-1 SAR data, DEM-based features, and meteorological variables.
- The models were trained using the following input features:
  - SAR features: VV, VH, incidence angle (angle), VV/VH, VH/VV
  - DEM-based features: Local Incidence Angle (LIA), elevation and slope
  - Meteorological features: sum of precipitation 12 hours prior to SAR acquisition (prec.12h) and temperature at the time of SAR acquisition;
  - Land cover category: the forest type as a diﬀerentiating feature between coniferous and broad-leaved forests
  - Temporal features: DOYsin and DOYcos containing information about the time of the corresponding SAR acquisition.
- Deploy for inference: Apply trained models to monitor vegetation indices in new regions or for near real-time applications.

**Demo codes will be provided soon**

## 📊 Training Details

### Training Data

The training data is available from the [SAR-based-VIs GitHub repository](https://github.com/palubad/SAR-based-VIs).

![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/V49cLxspCqdoN_aURaD_c.png)
Figure 2. Used areas for training and validation (training and validation data are not differentiated in this figure)

### Training Procedure

- Feature Selection: Using permutation feature importance analysis to identify key predictors.
- Data Splitting: Training and validation sets created with a balanced representation of healthy and disturbed forests.
- Hyperparameter Optimization:
  - RFR: Fine-tuned for maximum depth, number of trees, and minimum samples per split.
  - XGB: Optimized learning rate, tree depth, and number of boosting rounds.
- Model Training: Using scikit-learn and XGBoost libraries with MAE loss function.
- Computational Requirements:
  - XGB: Faster training with built-in early stopping (~30-70x faster than RFR).
  - RFR: Slower but slightly better performance for LAI and FAPAR.

#### Used computation infrastructure

12th Gen Intel(R) Core(TM) i7-12700 with 2.10 GHz, 64 Gigabyte of RAM and 20 CPU cores.

#### Training Hyperparameters

![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/OkAYKL7hrEPIsYW0z4CgA.png)
Figure 3. Hyperparameter tuning for NDVI.

![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/TMFkP0TrsPlC-ROXcWy1M.png)
Table 1. Best hyperparameter combinations identiﬁed for RFR and XGB. Bolded results represent the
best achieved results for the VI.

For detailed information on hyperparameter optimization, performances, speeds, please see the article Paluba et al. (2025).

## Evaluation metrics

- Mean Absolute Error (MAE): Primary metric for accuracy.
- Mean Squared Error (MSE): Secondary metric for accuracy.
- R² Score: To assess correlation with Sentinel-2 VIs.
- Transferability Test: Applied to different Central European forests (1,294 healthy deciduous and 1,253 healthy coniferous areas, and 1,195 disturbed areas).

![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/9Kvzn0XgLB0oL6tFduyUb.png)
Figure 4. Areas used to test the transferability of the models in Central Europe.

### 🚀 Results

Best models:
- RFR performed best for LAI (MAE ~0.06) and FAPAR.
- XGB performed best for EVI and NDVI.
- SAR-based VIs successfully replicated optical VIs, with clear seasonal and forest-type differentiation.
- Higher MAEs observed in NDVI estimation (~0.48), attributed to forest type inaccuracies and change detection errors.
- SAR-based VIs detected forest changes up to 4 days earlier than Sentinel-2 VIs, significantly improving change detection capabilities.
- Adding DEM and meteorological features improved R² by 3-4%.

Table 2. Best results for RFR and XGB for each VI. Bolded results represent the best achieved results for the VI. 
![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/1iLMhWwGJo6bbeb9COcSm.png)

#### ❗ Scenarios Where the Model May Not Work Well
- Forest areas significantly different from those in the training data (e.g., tropical rainforests, drylands).
- Extreme weather conditions (e.g., snow, heavy rain) affecting SAR signal interpretation.
- Recently disturbed areas with high structural variability, leading to noisier results.

#### ❗ Known limitations
- Reliance on forest type classification: Errors in input forest type maps can propagate into the VI estimations.
- The model's effectiveness in disturbed forests is lower than in healthy forests, which may affect early disturbance detection.
- Seasonal variations introduce noise, particularly in winter, affecting model accuracy.

#### ❗ Recommendations to overcome the limitations - future work
- Ensure diverse training data covering different forest types and disturbance scenarios to improve generalizability.
- Complement SAR-based estimations with optical data when available to enhance accuracy.
- Improve noise reduction techniques and incorporate multi-band SAR data (L-, P-bands) in future studies for better vegetation characterization.

## ⭐ Citation

> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2025): Estimating vegetation indices and biophysical parameters for Central European temperate forests with Sentinel-1 SAR data and machine learning. Published in Big Earth Data
> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2024): Identification of Optimal Sentinel-1 SAR Polarimetric Parameters for Forest Monitoring in Czechia. AUC Geographica 59(2), 1–15, DOI: [10.14712/23361980.2024.18](https://doi.org/10.14712/23361980.2024.18).

**BibTeX:**

Will be added soon.

**APA:**

Will be added soon.


- **Funded by:** Charles University Grant Agency – Grantová Agentura Univerzity Karlovy (GAUK) Grant No. 412722; the European Union’s Caroline Herschel Framework Partnership Agreement on Copernicus User Uptake under grant agreement No. FPA 275/G/GRO/COPE/17/10042, project FPCUP (Framework Partnership Agreement on Copernicus User Uptake) and the Spatial Data Analyst project (NPO_UK_MSMT-16602/2022) funded by the European Union – NextGenerationEU
