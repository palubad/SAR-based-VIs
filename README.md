# 🌲🌳 Supplementary data and ML models to estimate SAR-based Vegetation indices and biophysical variables for forest ecosystems [in Central Europe]

This study presents a machine learning-based approach to estimate optical vegetation indices and biophysical variables (hereafter referred to as VIs) using synthetic aperture radar (SAR) and ancillary data for forest monitoring. 
The best-performing models were Random Forest Regressor (RFR) for LAI and FAPAR and XGBoost (XGB) for EVI and NDVI - these models are available in this repository. These models were trained on temporally and spatially aligned time series (TS) datasets, containing Sentinel-1 SAR data, Sentinel-2 multispectral data, DEM-based features and meteorological variables. It provides an accurate and timely alternative to optical-based VIs.

This repository is part of the following paper: 
> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2025): Estimating vegetation indices and biophysical parameters for Central European temperate forests with Sentinel-1 SAR data and machine learning. Published in Big Earth Data
<br></br>

## 💾 The best-performing ML models can be found on [Hugging Face 🤗]([https://huggingface.co/palubad/SAR-based-VIs](https://huggingface.co/palubad/SAR-based-VIs-models)).
<br></br>
## ⚙️ A DEMO on how to apply the trained ML models in Google Colab [with data and model downloads]: [Try it out here](https://colab.research.google.com/drive/1z2uoZtrSv1PPtM6DZaFCN_TR5o8uEwaV?usp=sharing).

<br></br>
![image/png](https://cdn-uploads.huggingface.co/production/uploads/6798c936ece6b7910c55d1e5/3rueSUVk9bOqsFy4fsD-7.png)
Figure 1. Methodology used in the paper.

## ⚙️ Details

The study explores the feasibility of using SAR-based features in combination with additional datasets (e.g., DEM-based features and meteorological data) to estimate optical VIs, specifically, LAI, FAPAR, EVI and NDVI. Traditional optical remote sensing methods are often hindered by cloud cover, making it difficult to obtain continuous and reliable vegetation monitoring data. This research addresses this challenge by applying SAR data, which is unaffected by atmospheric conditions.
Using ML, particularly RFR and XGB, the study demonstrates that SAR-based VIs can replicate the patterns of optical-based VIs, while also offering advantages such as higher temporal resolution and all-year monitoring. The inclusion of ancillary data improves model accuracy, particularly in differentiating forest types and seasonal variations. The transferability tests confirm that the methodology generalizes well across Central European forests and shows potential for large-scale monitoring applications.

- **Developed by:** Daniel Paluba & Bertrand Le Saux
- **License:** CC BY 4.0

### 🔗 Other resources

- [MMTS-GEE](https://github.com/palubad/MMTS-GEE) to generate multi-modal and time series datasets with spatially and temporally aligned data.
> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2024): Identification of Optimal Sentinel-1 SAR Polarimetric Parameters for Forest Monitoring in Czechia. AUC Geographica 59(2), 1–15, DOI: [10.14712/23361980.2024.18](https://doi.org/10.14712/23361980.2024.18).


## Demo:
A DEMO on how to apply the trained ML models is available in Google Colab [with data and model downloads]: [Try it out here](https://colab.research.google.com/drive/1z2uoZtrSv1PPtM6DZaFCN_TR5o8uEwaV?usp=sharing)

## ⭐ Citation

> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2025): Estimating vegetation indices and biophysical parameters for Central European temperate forests with Sentinel-1 SAR data and machine learning. Published in Big Earth Data
<br></br>

> Paluba, D., Le Saux, B., Sarti, F., Štych, P. (2024): Identification of Optimal Sentinel-1 SAR Polarimetric Parameters for Forest Monitoring in Czechia. AUC Geographica 59(2), 1–15, DOI: [10.14712/23361980.2024.18](https://doi.org/10.14712/23361980.2024.18).

**BibTeX:**

Will be added soon.

**APA:**

Will be added soon.


- **Funded by:** Charles University Grant Agency – Grantová Agentura Univerzity Karlovy (GAUK) Grant No. 412722; the European Union’s Caroline Herschel Framework Partnership Agreement on Copernicus User Uptake under grant agreement No. FPA 275/G/GRO/COPE/17/10042, project FPCUP (Framework Partnership Agreement on Copernicus User Uptake) and the Spatial Data Analyst project (NPO_UK_MSMT-16602/2022) funded by the European Union – NextGenerationEU
