# File: main.py

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import pandas as pd
import numpy as np
from typing import List, Optional
import os
import math

app = FastAPI(title="HCES Data Visualization API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
if os.path.exists("build"):
    app.mount("/", StaticFiles(directory="build", html=True), name="static")

# Add this route to handle all other routes and return the React app
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if os.path.exists("build"):
        return FileResponse("build/index.html")
    return {"message": "React app not built yet"}

def clean_json_values(df):
    """Replace NaN, infinity with None for JSON compatibility"""
    for col in df.select_dtypes(include=['float64']).columns:
        df[col] = df[col].apply(lambda x: None if (pd.isna(x) or math.isinf(x)) else x)
    return df

# Load the data
@app.on_event("startup")
async def startup_db_client():
    try:
        app.state.df = pd.read_csv("data/hces_data_standardized.csv")
        # Convert binary columns to proper boolean
        binary_columns = [col for col in app.state.df.columns if col.startswith('has_') or col.startswith('is_')]
        for col in binary_columns:
            app.state.df[col] = app.state.df[col].astype(bool)
            
        # Rename 'caste' to 'social_group' as requested
        if 'caste' in app.state.df.columns:
            app.state.df = app.state.df.rename(columns={'caste': 'social_group'})
            
    except Exception as e:
        print(f"Error loading data: {e}")
        # Load a backup or sample if main data fails
        try:
            app.state.df = pd.read_csv("data/sample_hces_data.csv")
            # Similar conversions for sample data
        except:
            # Create empty DataFrame with expected columns if all else fails
            app.state.df = pd.DataFrame()
            print("Failed to load any data")

@app.get("/")
async def root():
    return {"message": "HCES Data Visualization API is running"}

@app.get("/api/states")
async def get_states():
    """Get list of all states in the dataset"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    states = app.state.df['state'].unique().tolist()
    return {"states": sorted(states)}

@app.get("/api/expenditure-overview")
async def get_expenditure_overview(state: Optional[str] = None):
    """
    Get overview of expenditure data.
    Can be filtered by state if state parameter is provided.
    """
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Filter by state if provided
    if state and state != 'All India':
        df = df[df['state'] == state]
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for state: {state}")
    
    # Calculate overall expenditure statistics
    overall_monthly_exp = df['household_reported_monthly_exp'].mean()
    rural_monthly_exp = df[df['sector'] == 'Rural']['household_reported_monthly_exp'].mean()
    urban_monthly_exp = df[df['sector'] == 'Urban']['household_reported_monthly_exp'].mean()
    
    # Get state-wise data for all states
    state_data = (
        df.groupby('state')['household_reported_monthly_exp']
        .agg(['mean', 'median', 'count'])
        .reset_index()
        .rename(columns={
            'mean': 'avg_monthly_exp',
            'median': 'median_monthly_exp',
            'count': 'sample_size'
        })
        .sort_values('avg_monthly_exp', ascending=False)
    )
    state_data = clean_json_values(state_data)
    
    # Define Union Territories to exclude them from the top/bottom states
    union_territories = [
        'Chandigarh', 'Puducherry', 'Andaman and Nicobar Islands', 'Lakshadweep',
        'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Ladakh', 
        'Jammu & Kashmir', 'Andaman and Nicobar'
    ]
    
    # Always use the global state data for rankings
    all_state_data = (
        app.state.df.groupby('state')['household_reported_monthly_exp']
        .agg(['mean'])
        .reset_index()
        .rename(columns={'mean': 'avg_monthly_exp'})
    )
    
    # Filter out UTs for ranking
    states_only = all_state_data[~all_state_data['state'].isin(union_territories)]
    
    # Sort for top and bottom states
    top_states_data = states_only.sort_values('avg_monthly_exp', ascending=False)
    bottom_states_data = states_only.sort_values('avg_monthly_exp', ascending=True)
    
    # Get top 5 and bottom 5 states
    top_states = top_states_data.head(5)[['state', 'avg_monthly_exp']].to_dict('records')
    bottom_states = bottom_states_data.head(5)[['state', 'avg_monthly_exp']].to_dict('records')
    
    # Clean the values
    top_states = [{k: (None if pd.isna(v) or (isinstance(v, float) and np.isinf(v)) else v) 
                  for k, v in state.items()} for state in top_states]
    bottom_states = [{k: (None if pd.isna(v) or (isinstance(v, float) and np.isinf(v)) else v) 
                     for k, v in state.items()} for state in bottom_states]
    
    # Create state rankings
    state_rankings = {
        'top': top_states,
        'bottom': bottom_states
    }
    
    # Calculate major expenditure categories
    expenditure_columns = [
        'food_monthly_value',  # We'll calculate this
        'fuel_light_monthly_value',
        'clothing_monthly_value',
        'footwear_monthly_value',
        'medical_hospitalisation_monthly_value',
        'medical_non_hospitalisation_monthly_value',
        'rent_monthly_value',
        'imputed_rent_monthly_value',
        'conveyance_monthly_value',
        'consumer_services_monthly_value',
        'entertainment_monthly_value',
    ]
    
    # Calculate food expenditure (sum of all food categories)
    food_columns = [
        'cereals_monthly_total_value',
        'pulses_monthly_total_value',
        'milk_products_monthly_total_value',
        'edible_oils_monthly_total_value',
        'egg_fish_meat_monthly_total_value',
        'vegetables_monthly_total_value',
        'fruits_fresh_monthly_total_value',
        'fruits_dry_monthly_total_value',
        'spices_monthly_total_value',
        'salt_sugar_monthly_total_value',
        'beverages_monthly_total_value'
    ]
    
    df['food_monthly_value'] = df[food_columns].sum(axis=1)
    
    # Prepare expenditure breakdown data
    expenditure_breakdown = [
        {'category': 'Food', 'value': df['food_monthly_value'].mean()},
        {'category': 'Fuel & Light', 'value': df['fuel_light_monthly_value'].mean()},
        {'category': 'Housing', 'value': df[['rent_monthly_value', 'imputed_rent_monthly_value']].sum(axis=1).mean()},
        {'category': 'Clothing & Footwear', 'value': df[['clothing_monthly_value', 'footwear_monthly_value']].sum(axis=1).mean()},
        {'category': 'Healthcare', 'value': df[['medical_hospitalisation_monthly_value', 'medical_non_hospitalisation_monthly_value']].sum(axis=1).mean()},
        {'category': 'Transport', 'value': df['conveyance_monthly_value'].mean()},
        {'category': 'Entertainment', 'value': df['entertainment_monthly_value'].mean()}
    ]
    
    # Food expenditure details
    food_expenditure_value = [
        {'category': 'Cereals', 'value': df['cereals_monthly_total_value'].mean()},
        {'category': 'Pulses', 'value': df['pulses_monthly_total_value'].mean()},
        {'category': 'Milk Products', 'value': df['milk_products_monthly_total_value'].mean()},
        {'category': 'Edible Oils', 'value': df['edible_oils_monthly_total_value'].mean()},
        {'category': 'Vegetables', 'value': df['vegetables_monthly_total_value'].mean()},
        {'category': 'Fresh Fruits', 'value': df['fruits_fresh_monthly_total_value'].mean()},
        {'category': 'Dry Fruits', 'value': df['fruits_dry_monthly_total_value'].mean()},
        {'category': 'Meat/Fish/Eggs', 'value': df['egg_fish_meat_monthly_total_value'].mean()},
        {'category': 'Spices', 'value': df['spices_monthly_total_value'].mean()},
        {'category': 'Sugar & Salt', 'value': df['salt_sugar_monthly_total_value'].mean()},
        {'category': 'Beverages', 'value': df['beverages_monthly_total_value'].mean()}
    ]
    
    # Clean expenditure breakdown and food values
    expenditure_breakdown = clean_json_values(pd.DataFrame(expenditure_breakdown)).to_dict('records')
    food_expenditure_value = clean_json_values(pd.DataFrame(food_expenditure_value)).to_dict('records')
    
    # Calculate percentages for food items
    total_food_exp = df['food_monthly_value'].mean()
    if total_food_exp > 0:
        food_expenditure_percent = [
            {'category': item['category'], 'value': (item['value'] / total_food_exp) * 100 if total_food_exp > 0 else 0} 
            for item in food_expenditure_value
        ]
        food_expenditure_percent = clean_json_values(pd.DataFrame(food_expenditure_percent)).to_dict('records')
    else:
        food_expenditure_percent = food_expenditure_value
    
    # Non-essential expenditure details
    non_essential_details = [
        {'category': 'Pan', 'value': df['pan_monthly_value'].mean()},
        {'category': 'Tobacco', 'value': df['tobacco_monthly_value'].mean()},
        {'category': 'Intoxicants', 'value': df['intoxicants_monthly_value'].mean()},
        {'category': 'Entertainment', 'value': df['entertainment_monthly_value'].mean()}
    ]
    
    # Clean non-essential values
    non_essential_details = clean_json_values(pd.DataFrame(non_essential_details)).to_dict('records')
    
    # Prepare response
    response = {
        "overview": {
            "overall_monthly_exp": overall_monthly_exp,
            "rural_monthly_exp": rural_monthly_exp,
            "urban_monthly_exp": urban_monthly_exp,
            "sample_size": len(df)
        },
        "stateData": state_data.to_dict('records'),
        "stateRankings": state_rankings,
        "expenditureBreakdown": expenditure_breakdown,
        "foodExpenditureDetails": {
            "valueData": food_expenditure_value,
            "percentageData": food_expenditure_percent
        },
        "nonEssentialDetails": non_essential_details
    }
    
    return response
@app.get("/api/rural-urban-comparison")
async def get_rural_urban_comparison():
    """Get comparison data between rural and urban sectors"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Expenditure comparison
    expenditure_by_sector = (
        df.groupby('sector')['household_reported_monthly_exp']
        .agg(['mean', 'median', 'std'])
        .reset_index()
    )
    expenditure_by_sector = clean_json_values(expenditure_by_sector)
    
    # Calculate food expenditure percentage
    food_columns = [
        'cereals_monthly_total_value', 'pulses_monthly_total_value',
        'milk_products_monthly_total_value', 'edible_oils_monthly_total_value',
        'egg_fish_meat_monthly_total_value', 'vegetables_monthly_total_value',
        'fruits_fresh_monthly_total_value', 'fruits_dry_monthly_total_value',
        'spices_monthly_total_value', 'salt_sugar_monthly_total_value',
        'beverages_monthly_total_value'
    ]
    
    df['food_monthly_value'] = df[food_columns].sum(axis=1)
    df['food_expenditure_pct'] = (df['food_monthly_value'] / df['household_reported_monthly_exp']) * 100
    
    food_pct_by_sector = (
        df.groupby('sector')['food_expenditure_pct']
        .mean()
        .reset_index()
        .rename(columns={'food_expenditure_pct': 'avg_food_expenditure_pct'})
    )
    food_pct_by_sector = clean_json_values(food_pct_by_sector)
    
        # Calculate expenditure for major categories
    expense_categories = [
        ('Food', 'food_monthly_value'),
        ('Housing', ['rent_monthly_value', 'imputed_rent_monthly_value']),
        ('Healthcare', ['medical_hospitalisation_monthly_value', 'medical_non_hospitalisation_monthly_value']),
        ('Education', 'education_monthly_value'),
        ('Transport', 'conveyance_monthly_value'),
        ('Fuel & Light', 'fuel_light_monthly_value'),
        ('Clothing & Footwear', ['clothing_monthly_value', 'footwear_monthly_value']),
        ('Personal Goods', 'personal_goods_monthly_value'),
        ('Entertainment', 'entertainment_monthly_value'),
        ('Consumer Services', 'consumer_services_monthly_value')
    ]

    # Create category expenditure data - one approach that ensures 100% total
    rural_totals = {}
    urban_totals = {}

    # First calculate average values for each category by sector
    for category_name, column_names in expense_categories:
        if isinstance(column_names, list):
            # Sum multiple columns
            for sector in ['Rural', 'Urban']:
                sector_df = df[df['sector'] == sector]
                if not sector_df.empty:
                    avg_value = sector_df[column_names].sum(axis=1).mean()
                    if sector == 'Rural':
                        rural_totals[category_name] = avg_value
                    else:
                        urban_totals[category_name] = avg_value
        else:
            # Use the single column directly
            for sector in ['Rural', 'Urban']:
                sector_df = df[df['sector'] == sector]
                if not sector_df.empty:
                    avg_value = sector_df[column_names].mean()
                    if sector == 'Rural':
                        rural_totals[category_name] = avg_value
                    else:
                        urban_totals[category_name] = avg_value

    # Calculate total for normalization
    rural_total_expenditure = sum(rural_totals.values())
    urban_total_expenditure = sum(urban_totals.values())

    # Create category expenditure data with proper percentages
    category_expenditure = []
    for category_name in rural_totals.keys():
        # Rural percentage
        rural_percentage = (rural_totals[category_name] / rural_total_expenditure * 100) if rural_total_expenditure > 0 else 0
        
        # Urban percentage
        urban_percentage = (urban_totals[category_name] / urban_total_expenditure * 100) if urban_total_expenditure > 0 else 0
        
        # Add rural data
        category_expenditure.append({
            'category': category_name,
            'sector': 'Rural',
            'value': rural_totals[category_name],
            'percentage': rural_percentage
        })
        
        # Add urban data
        category_expenditure.append({
            'category': category_name,
            'sector': 'Urban',
            'value': urban_totals[category_name],
            'percentage': urban_percentage
        })
    # Processed and packaged food
    processed_food_by_sector = (
        df.groupby('sector')[['served_processed_food_monthly_total_value', 'packaged_processed_food_monthly_total_value']]
        .mean()
        .reset_index()
    )
    processed_food_by_sector = clean_json_values(processed_food_by_sector)
    
    # Meals data
    meals_by_sector = (
        df.groupby('sector')[['total_meals_daily', 'total_meals_school', 'total_meals_employer', 
                               'total_meals_home', 'avg_meals_per_person',
                              'meal_diversity']]
        .mean()
        .reset_index()
    )
    meals_by_sector = clean_json_values(meals_by_sector)
    
    # Ration card types
    if 'type_rationcard' in df.columns:
        # Use the specific values you provided
        ration_types = ["AAY", "BPL", "APL", "PHH", "SFSS", "Others", "No ration card"]
        ration_data = []
        
        for ration_type in ration_types:
            for sector in ['Rural', 'Urban']:
                sector_data = df[df['sector'] == sector]
                if not sector_data.empty:
                    # Count households with this ration card type
                    count = len(sector_data[sector_data['type_rationcard'] == ration_type])
                    # Calculate percentage
                    percentage = (count / len(sector_data)) * 100
                    ration_data.append({
                        'ration_type': ration_type,
                        'sector': sector,
                        'count': count,
                        'percentage': percentage
                    })
    else:
        ration_data = []
    
    # Cooking source data
    if 'source_cooking' in df.columns:
        cooking_sources = df['source_cooking'].unique().tolist()
        cooking_data = []
        
        for source in cooking_sources:
            for sector in ['Rural', 'Urban']:
                sector_data = df[df['sector'] == sector]
                if not sector_data.empty:
                    count = len(sector_data[sector_data['source_cooking'] == source])
                    percentage = (count / len(sector_data)) * 100
                    cooking_data.append({
                        'source': source,
                        'sector': sector,
                        'count': count,
                        'percentage': percentage
                    })
    else:
        cooking_data = []
    
    # Transport mode data (based on vehicle ownership)
    transport_columns = ['has_bicycle', 'has_bike', 'has_car', 'has_truck', 'has_animalcart']
    transport_data = []
    
    for column in transport_columns:
        if column in df.columns:
            for sector in ['Rural', 'Urban']:
                sector_data = df[df['sector'] == sector]
                if not sector_data.empty:
                    ownership_rate = sector_data[column].mean() * 100
                    transport_name = column.replace('has_', '')
                    transport_data.append({
                        'transport_mode': transport_name,
                        'sector': sector,
                        'ownership_rate': ownership_rate
                    })
    
    # Digital access comparison
    digital_access = (
        df.groupby('sector')[['has_internet', 'has_mobile', 'has_laptop', 'total_online_expenditure']]
        .agg({
            'has_internet': 'mean',
            'has_mobile': 'mean',
            'has_laptop': 'mean',
            'total_online_expenditure': 'mean'
        })
        .reset_index()
        .rename(columns={
            'has_internet': 'internet_access_rate',
            'has_mobile': 'mobile_ownership_rate',
            'has_laptop': 'laptop_ownership_rate',
            'total_online_expenditure': 'avg_online_expenditure'
        })
    )
    digital_access = clean_json_values(digital_access)
    
    # Essential services comparison
    df['has_electricity'] = (df['source_lighting'] == 'Electricity').astype(int)
    df['has_piped_water'] = df['source_water'].str.contains('Piped water').astype(int)
    df['has_toilet'] = (df['level_access_latrine'] != 'No access').astype(int)
    
    essential_services = (
        df.groupby('sector')[['has_electricity', 'has_piped_water', 'has_toilet']]
        .agg({
            'has_electricity': 'mean',
            'has_piped_water': 'mean',
            'has_toilet': 'mean'
        })
        .reset_index()
        .rename(columns={
            'has_electricity': 'electricity_access_rate',
            'has_piped_water': 'piped_water_access_rate',
            'has_toilet': 'toilet_access_rate'
        })
    )
    essential_services = clean_json_values(essential_services)
    
    # Government program participation
    govt_programs = (
        df.groupby('sector')[['has_pmgky', 'is_hhmem_pmjay', 'receieved_subsidy_lpg', 'received_free_electricity']]
        .agg({
            'has_pmgky': 'mean',
            'is_hhmem_pmjay': 'mean',
            'receieved_subsidy_lpg': 'mean',
            'received_free_electricity': 'mean'
        })
        .reset_index()
        .rename(columns={
            'has_pmgky': 'pmgky_participation_rate',
            'is_hhmem_pmjay': 'pmjay_participation_rate',
            'receieved_subsidy_lpg': 'lpg_subsidy_rate',
            'received_free_electricity': 'free_electricity_rate'
        })
    )
    govt_programs = clean_json_values(govt_programs)
    
    # Prepare response
    response = {
        "expenditure": expenditure_by_sector.to_dict('records'),
        "foodPercentage": food_pct_by_sector.to_dict('records'),
        "categoryExpenditure": category_expenditure,
        "processedFood": processed_food_by_sector.to_dict('records'),
        "meals": meals_by_sector.to_dict('records'),
        "rationData": ration_data,
        "cookingData": cooking_data,
        "transportData": transport_data,
        "digitalAccess": digital_access.to_dict('records'),
        "essentialServices": essential_services.to_dict('records'),
        "govtPrograms": govt_programs.to_dict('records')
    }
    
    return response

@app.get("/api/household-type-comparison")
async def get_household_type_comparison():
    """Get comparison data between different household types"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Expenditure by household type
    expenditure_by_type = (
        df.groupby('hh_type')['household_reported_monthly_exp']
        .agg(['mean', 'median', 'count'])
        .reset_index()
        .rename(columns={
            'mean': 'avg_monthly_exp',
            'median': 'median_monthly_exp',
            'count': 'sample_size'
        })
        .sort_values('avg_monthly_exp', ascending=False)
    )
    expenditure_by_type = clean_json_values(expenditure_by_type)
    
    # Calculate food expenditure
    food_columns = [
        'cereals_monthly_total_value', 'pulses_monthly_total_value',
        'milk_products_monthly_total_value', 'edible_oils_monthly_total_value',
        'egg_fish_meat_monthly_total_value', 'vegetables_monthly_total_value',
        'fruits_fresh_monthly_total_value', 'fruits_dry_monthly_total_value',
        'spices_monthly_total_value', 'salt_sugar_monthly_total_value',
        'beverages_monthly_total_value'
    ]
    
    df['food_monthly_value'] = df[food_columns].sum(axis=1)
    
    # Food expenditure by household type
    food_exp_by_type = (
        df.groupby('hh_type')[['food_monthly_value', 'household_reported_monthly_exp']]
        .agg({
            'food_monthly_value': 'mean',
            'household_reported_monthly_exp': 'mean'
        })
        .reset_index()
    )
    
    food_exp_by_type['food_pct'] = (food_exp_by_type['food_monthly_value'] / food_exp_by_type['household_reported_monthly_exp']) * 100
    food_exp_by_type = clean_json_values(food_exp_by_type)
    
        # Asset ownership by household type
    asset_columns = [
        'has_tv', 'has_fridge', 'has_washingmachine', 'has_ac',
        'has_computer', 'has_internet', 'has_mobile',
        'has_bike', 'has_car'
    ]

    # Ensure 'has_computer' exists (might be 'has_laptop' in the data)
    if 'has_laptop' in df.columns and 'has_computer' not in df.columns:
        df['has_computer'] = df['has_laptop']

    asset_ownership = []
    for asset in asset_columns:
        if asset in df.columns:
            for hh_type in df['hh_type'].unique():
                hh_type_data = df[df['hh_type'] == hh_type]
                if not hh_type_data.empty:
                    ownership_rate = hh_type_data[asset].mean()
                    asset_name = asset.replace('has_', '')
                    asset_ownership.append({
                        'hh_type': hh_type,
                        'asset': asset_name,
                        'ownership_rate': ownership_rate
                    })

    asset_ownership_df = pd.DataFrame(asset_ownership)
    asset_ownership_df = clean_json_values(asset_ownership_df)
    
    # Education by household type
    education_by_type = (
        df.groupby('hh_type')['avg_edu_years']
        .mean()
        .reset_index()
        .rename(columns={'avg_edu_years': 'avg_education_years'})
        .sort_values('avg_education_years', ascending=False)
    )
    education_by_type = clean_json_values(education_by_type)
    
    # Expenditure on non-essentials by household type
    non_essential_columns = ['pan_monthly_value', 'tobacco_monthly_value', 'intoxicants_monthly_value']
    
    df['non_essential_monthly_value'] = df[non_essential_columns].sum(axis=1)
    
    non_essential_by_type = (
        df.groupby('hh_type')[['non_essential_monthly_value', 'household_reported_monthly_exp']]
        .agg({
            'non_essential_monthly_value': 'mean',
            'household_reported_monthly_exp': 'mean'
        })
        .reset_index()
    )
    
    non_essential_by_type['non_essential_pct'] = (non_essential_by_type['non_essential_monthly_value'] / non_essential_by_type['household_reported_monthly_exp']) * 100
    non_essential_by_type = clean_json_values(non_essential_by_type)
    
    # Prepare response
    response = {
        "expenditureByType": expenditure_by_type.to_dict('records'),
        "foodExpenditureByType": food_exp_by_type[['hh_type', 'food_monthly_value', 'food_pct']].to_dict('records'),
        "assetOwnershipByType": asset_ownership_df.to_dict('records'),
        "educationByType": education_by_type.to_dict('records'),
        "nonEssentialByType": non_essential_by_type[['hh_type', 'non_essential_monthly_value', 'non_essential_pct']].to_dict('records')
    }
    
    return response

@app.get("/api/digital-inclusion")
async def get_digital_inclusion():
    """Get data related to digital inclusion metrics"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Internet access by state
    internet_by_state = []
    for sector in ['Rural', 'Urban']:
        sector_data = df[df['sector'] == sector]
        if not sector_data.empty:
            state_internet = (
                sector_data.groupby('state')['has_internet']
                .mean()
                .reset_index()
                .rename(columns={'has_internet': 'internet_access_rate'})
            )
            state_internet['sector'] = sector
            internet_by_state.append(state_internet)
    
    internet_by_state_df = pd.concat(internet_by_state) if internet_by_state else pd.DataFrame()
    internet_by_state_df = clean_json_values(internet_by_state_df)
    
    # Internet access by social group
    internet_by_social = (
        df.groupby('social_group')['has_internet']
        .agg(['mean', 'count'])
        .reset_index()
        .rename(columns={'mean': 'internet_access_rate', 'count': 'sample_size'})
        .sort_values('internet_access_rate', ascending=False)
    )
    internet_by_social = clean_json_values(internet_by_social)
    
    # Online shopping categories
    online_shopping_cols = [col for col in df.columns if col.startswith('online_') and col not in ['online_expenditure', 'total_online_expenditure']]
    
    online_shopping_rates = []
    for col in online_shopping_cols:
        category = col.replace('online_', '').replace('_', ' ').title()
        rate = df[col].mean() if col in df.columns else 0
        online_shopping_rates.append({
            'category': category,
            'usage_rate': rate
        })
    
    # Sort by usage rate descending
    online_shopping_rates = sorted(online_shopping_rates, key=lambda x: x['usage_rate'], reverse=True)
    
    # Digital device ownership
    digital_devices = [
        {'device': 'Mobile Phone', 'ownership_rate': df['has_mobile'].mean() if 'has_mobile' in df.columns else 0},
        {'device': 'Television', 'ownership_rate': df['has_tv'].mean() if 'has_tv' in df.columns else 0},
        {'device': 'Computer/Laptop', 'ownership_rate': df['has_laptop'].mean() if 'has_laptop' in df.columns else 0}
    ]
    
    # Internet access vs expenditure
    df['has_internet_bin'] = df['has_internet'].astype(int)
    internet_vs_expenditure = (
        df.groupby('has_internet_bin')['household_reported_monthly_exp']
        .agg(['mean', 'median', 'count'])
        .reset_index()
        .rename(columns={
            'has_internet_bin': 'has_internet',
            'mean': 'avg_monthly_exp',
            'median': 'median_monthly_exp',
            'count': 'sample_size'
        })
    )
    internet_vs_expenditure = clean_json_values(internet_vs_expenditure)
    
    # Online shopping by state
    if online_shopping_cols:
        # Create a column to indicate if household does any online shopping
        df['does_online_shopping'] = df[online_shopping_cols].max(axis=1)
        
        online_shopping_by_state = (
            df.groupby('state')['does_online_shopping']
            .mean()
            .reset_index()
            .rename(columns={'does_online_shopping': 'online_shopping_rate'})
            .sort_values('online_shopping_rate', ascending=False)
        )
        online_shopping_by_state = clean_json_values(online_shopping_by_state)
    else:
        online_shopping_by_state = pd.DataFrame()
    
    # Online shopping vs expenditure
    if online_shopping_cols:
        # Create expenditure quintiles (5 groups) for better visualization
        try:
            df['expenditure_quintile'] = pd.qcut(df['household_reported_monthly_exp'], 5, labels=False)
            
            # For each quintile, calculate online shopping rate
            online_shopping_vs_expenditure = (
                df.groupby('expenditure_quintile')['does_online_shopping']
                .mean()
                .reset_index()
            )
            
            # Add readable labels for expenditure groups
            expenditure_ranges = []
            for i in range(5):
                lower = df[df['expenditure_quintile'] == i]['household_reported_monthly_exp'].min()
                upper = df[df['expenditure_quintile'] == i]['household_reported_monthly_exp'].max()
                expenditure_ranges.append((i, f'₹{int(lower)}-₹{int(upper)}'))
            
            for i, label in expenditure_ranges:
                online_shopping_vs_expenditure.loc[
                    online_shopping_vs_expenditure['expenditure_quintile'] == i, 
                    'expenditure_group'
                ] = label
            
            online_shopping_vs_expenditure['online_shopping_rate'] = online_shopping_vs_expenditure['does_online_shopping'] * 100
            online_shopping_vs_expenditure = online_shopping_vs_expenditure[['expenditure_group', 'online_shopping_rate']]
            online_shopping_vs_expenditure = clean_json_values(online_shopping_vs_expenditure)
        except Exception as e:
            # Fallback if qcut fails (e.g., if expenditures are all the same)
            print(f"Error creating expenditure groups: {e}")
            online_shopping_vs_expenditure = pd.DataFrame()
    else:
        online_shopping_vs_expenditure = pd.DataFrame()
    
    # Prepare response
    response = {
        "internetByState": internet_by_state_df.to_dict('records'),
        "internetBySocialGroup": internet_by_social.to_dict('records'),
        "onlineShoppingCategories": online_shopping_rates,
        "digitalDeviceOwnership": digital_devices,
        "internetVsExpenditure": internet_vs_expenditure.to_dict('records'),
        "onlineShoppingByState": online_shopping_by_state.to_dict('records') if not online_shopping_by_state.empty else [],
        "onlineShoppingVsExpenditure": online_shopping_vs_expenditure.to_dict('records') if not online_shopping_vs_expenditure.empty else []
    }
    
    return response

@app.get("/api/essential-services")
async def get_essential_services(state: Optional[str] = None):
    """Get data related to essential services access"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Create derived columns for essential services using the full dataset
    full_df = app.state.df  # Keep a reference to the full dataset
    full_df['has_electricity'] = (full_df['source_lighting'] == 'Electricity').astype(int)
    full_df['has_piped_water'] = full_df['source_water'].str.contains('Piped water').astype(int)
    full_df['has_toilet'] = (full_df['level_access_latrine'] != 'No access').astype(int)
    
    # Calculate top and bottom states for each service using the full dataset
    top_bottom_states = {}
    for service_name, service_col in [
        ('electricity', 'has_electricity'),
        ('piped_water', 'has_piped_water'),
        ('toilet', 'has_toilet')
    ]:
        # Calculate rates by state
        service_by_state = (
            full_df.groupby('state')[service_col]
            .mean()
            .reset_index()
            .rename(columns={service_col: 'access_rate'})
        )
        service_by_state = clean_json_values(service_by_state)
        
        # Get top 5 states
        top_states = service_by_state.sort_values('access_rate', ascending=False).head(5)
        
        # Get bottom 5 states
        bottom_states = service_by_state.sort_values('access_rate').head(5)
        
        top_bottom_states[service_name] = {
            'top': top_states.to_dict('records'),
            'bottom': bottom_states.to_dict('records')
        }
    
    # Now filter the dataset for state-specific analysis if requested
    if state and state != 'All India':
        df = df[df['state'] == state]
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for state: {state}")
    
    # Create derived columns for essential services on the filtered dataset
    df['has_electricity'] = (df['source_lighting'] == 'Electricity').astype(int)
    df['has_piped_water'] = df['source_water'].str.contains('Piped water').astype(int)
    df['has_toilet'] = (df['level_access_latrine'] != 'No access').astype(int)
    
    # Essential services by state (for filtered state or all states)
    services_by_state = []
    for service in ['has_electricity', 'has_piped_water', 'has_toilet']:
        temp = (
            df.groupby('state')[service]
            .mean()
            .reset_index()
            .rename(columns={service: 'access_rate'})
        )
        temp['service'] = service.replace('has_', '')
        services_by_state.append(temp)
    
    services_by_state_df = pd.concat(services_by_state)
    services_by_state_df = clean_json_values(services_by_state_df)
    
    # Essential services by rural/urban
    services_by_sector = (
        df.groupby('sector')[['has_electricity', 'has_piped_water', 'has_toilet']]
        .mean()
        .reset_index()
        .rename(columns={
            'has_electricity': 'electricity_access_rate',
            'has_piped_water': 'piped_water_access_rate',
            'has_toilet': 'toilet_access_rate'
        })
    )
    services_by_sector = clean_json_values(services_by_sector)
    
    # Essential services by social group
    services_by_social = (
        df.groupby('social_group')[['has_electricity', 'has_piped_water', 'has_toilet']]
        .mean()
        .reset_index()
        .rename(columns={
            'has_electricity': 'electricity_access_rate',
            'has_piped_water': 'piped_water_access_rate',
            'has_toilet': 'toilet_access_rate'
        })
    )
    services_by_social = clean_json_values(services_by_social)
    
    # Impact of services on expenditure
    # Create a service access score (0-3) based on number of services
    df['service_access_score'] = (
        df['has_electricity'] + df['has_piped_water'] + 
        df['has_toilet']
    )
    
    services_vs_expenditure = (
        df.groupby('service_access_score')['household_reported_monthly_exp']
        .agg(['mean', 'median', 'count'])
        .reset_index()
        .rename(columns={
            'mean': 'avg_monthly_exp',
            'median': 'median_monthly_exp',
            'count': 'sample_size'
        })
    )
    services_vs_expenditure = clean_json_values(services_vs_expenditure)
    
    # Prepare response
    response = {
        "servicesByState": services_by_state_df.to_dict('records'),
        "servicesBySector": services_by_sector.to_dict('records'),
        "servicesBySocialGroup": services_by_social.to_dict('records'),
        "servicesVsExpenditure": services_vs_expenditure.to_dict('records'),
        "topBottomStates": top_bottom_states
    }
    
    return response

@app.get("/api/govt-programs")
async def get_govt_programs(state: Optional[str] = None):
    """Get data related to government program participation"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Always calculate top and bottom states using all data, regardless of filter
    all_states_program_data = []
    for program, col in [
        ('PMGKY', 'has_pmgky'),
        ('PMJAY', 'is_hhmem_pmjay'),
        ('LPG Subsidy', 'receieved_subsidy_lpg'),
        ('Free Electricity', 'received_free_electricity')
    ]:
        if col in df.columns:
            temp = (
                df.groupby('state')[col]
                .mean()
                .reset_index()
                .rename(columns={col: 'participation_rate'})
            )
            temp['program'] = program
            all_states_program_data.append(temp)
    
    all_states_program_df = pd.concat(all_states_program_data) if all_states_program_data else pd.DataFrame()
    if not all_states_program_df.empty:
        all_states_program_df = clean_json_values(all_states_program_df)
    
    # Now filter data for the rest of the analysis if state is provided
    filtered_df = df
    if state and state != 'All India':
        filtered_df = df[df['state'] == state]
        if filtered_df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for state: {state}")
    
    # Program participation overall
    program_participation = [
        {'program': 'PMGKY', 'participation_rate': filtered_df['has_pmgky'].mean() if 'has_pmgky' in filtered_df.columns else 0},
        {'program': 'PMJAY', 'participation_rate': filtered_df['is_hhmem_pmjay'].mean() if 'is_hhmem_pmjay' in filtered_df.columns else 0},
        {'program': 'LPG Subsidy', 'participation_rate': filtered_df['receieved_subsidy_lpg'].mean() if 'receieved_subsidy_lpg' in filtered_df.columns else 0},
        {'program': 'Free Electricity', 'participation_rate': filtered_df['received_free_electricity'].mean() if 'received_free_electricity' in filtered_df.columns else 0}
    ]
    
    # Program participation by state (for filtered data)
    programs_by_state = []
    for program, col in [
        ('PMGKY', 'has_pmgky'),
        ('PMJAY', 'is_hhmem_pmjay'),
        ('LPG Subsidy', 'receieved_subsidy_lpg'),
        ('Free Electricity', 'received_free_electricity')
    ]:
        if col in filtered_df.columns:
            temp = (
                filtered_df.groupby('state')[col]
                .mean()
                .reset_index()
                .rename(columns={col: 'participation_rate'})
            )
            temp['program'] = program
            programs_by_state.append(temp)
    
    programs_by_state_df = pd.concat(programs_by_state) if programs_by_state else pd.DataFrame()
    if not programs_by_state_df.empty:
        programs_by_state_df = clean_json_values(programs_by_state_df)
    
    # Program participation by social group
    programs_by_social = []
    for program, col in [
        ('PMGKY', 'has_pmgky'),
        ('PMJAY', 'is_hhmem_pmjay'),
        ('LPG Subsidy', 'receieved_subsidy_lpg'),
        ('Free Electricity', 'received_free_electricity')
    ]:
        if col in filtered_df.columns:
            temp = (
                filtered_df.groupby('social_group')[col]
                .mean()
                .reset_index()
                .rename(columns={col: 'participation_rate'})
            )
            temp['program'] = program
            programs_by_social.append(temp)
    
    programs_by_social_df = pd.concat(programs_by_social) if programs_by_social else pd.DataFrame()
    if not programs_by_social_df.empty:
        programs_by_social_df = clean_json_values(programs_by_social_df)
    
    # Impact of programs on expenditure
    # Create a program participation score (0-4) based on number of programs
    program_cols = ['has_pmgky', 'is_hhmem_pmjay', 'receieved_subsidy_lpg', 'received_free_electricity']
    valid_program_cols = [col for col in program_cols if col in filtered_df.columns]
    
    if valid_program_cols:
        filtered_df['program_participation_score'] = filtered_df[valid_program_cols].sum(axis=1)
        
        programs_vs_expenditure = (
            filtered_df.groupby('program_participation_score')['household_reported_monthly_exp']
            .agg(['mean', 'median', 'count'])
            .reset_index()
            .rename(columns={
                'mean': 'avg_monthly_exp',
                'median': 'median_monthly_exp',
                'count': 'sample_size'
            })
        )
        programs_vs_expenditure = clean_json_values(programs_vs_expenditure)
    else:
        programs_vs_expenditure = pd.DataFrame()
    
    # Usage of ration system
    if 'used_ration' in filtered_df.columns:
        ration_usage = (
            filtered_df.groupby(['social_group', 'sector'])['used_ration']
            .mean()
            .reset_index()
            .rename(columns={'used_ration': 'ration_usage_rate'})
        )
        ration_usage = clean_json_values(ration_usage)
    else:
        ration_usage = pd.DataFrame()
    
    # For top/bottom states, use the all_states_program_df
    top_bottom_states = {}
    if not all_states_program_df.empty:
        for program in ['PMGKY', 'PMJAY', 'LPG Subsidy', 'Free Electricity']:
            program_data = all_states_program_df[all_states_program_df['program'] == program]
            if not program_data.empty:
                # Sort for top states
                top_states = program_data.sort_values('participation_rate', ascending=False).head(5)
                # Sort for bottom states
                bottom_states = program_data.sort_values('participation_rate').head(5)
                
                top_bottom_states[program] = {
                    'top': top_states.to_dict('records'),
                    'bottom': bottom_states.to_dict('records')
                }
    
    # Program participation by sector (rural vs urban)
    programs_by_sector = []
    for program, col in [
        ('PMGKY', 'has_pmgky'),
        ('PMJAY', 'is_hhmem_pmjay'),
        ('LPG Subsidy', 'receieved_subsidy_lpg'),
        ('Free Electricity', 'received_free_electricity')
    ]:
        if col in filtered_df.columns:
            temp = (
                filtered_df.groupby('sector')[col]
                .mean()
                .reset_index()
                .rename(columns={col: 'participation_rate'})
            )
            temp['program'] = program
            programs_by_sector.append(temp)
    
    programs_by_sector_df = pd.concat(programs_by_sector) if programs_by_sector else pd.DataFrame()
    if not programs_by_sector_df.empty:
        programs_by_sector_df = clean_json_values(programs_by_sector_df)
    
    # Income quintile analysis - FIX THE DUPLICATE EDGES ERROR
    try:
        # Use pd.qcut with duplicates='drop' to avoid the duplicate edges error
        filtered_df['income_quintile'] = pd.qcut(filtered_df['household_reported_monthly_exp'], 
                                               5, 
                                               labels=False, 
                                               duplicates='drop')
        
        programs_by_income = []
        for program, col in [
            ('PMGKY', 'has_pmgky'),
            ('PMJAY', 'is_hhmem_pmjay'),
            ('LPG Subsidy', 'receieved_subsidy_lpg'),
            ('Free Electricity', 'received_free_electricity')
        ]:
            if col in filtered_df.columns:
                temp = (
                    filtered_df.groupby('income_quintile')[col]
                    .mean()
                    .reset_index()
                    .rename(columns={col: 'participation_rate'})
                )
                temp['program'] = program
                # Convert quintile to readable label
                temp['income_group'] = temp['income_quintile'].apply(
                    lambda x: f"Q{int(x)+1} ({['Lowest', 'Lower', 'Middle', 'Higher', 'Highest'][int(x)]})" if pd.notna(x) and x < 5 else "Other"
                )
                programs_by_income.append(temp)
        
        programs_by_income_df = pd.concat(programs_by_income) if programs_by_income else pd.DataFrame()
        if not programs_by_income_df.empty:
            programs_by_income_df = clean_json_values(programs_by_income_df)
    except Exception as e:
        print(f"Error in income quintile analysis: {e}")
        # If the quintile division fails, use a simpler approach with equal bins
        try:
            filtered_df['income_quintile'] = pd.cut(filtered_df['household_reported_monthly_exp'], 
                                                  5, 
                                                  labels=False)
            
            programs_by_income = []
            for program, col in [
                ('PMGKY', 'has_pmgky'),
                ('PMJAY', 'is_hhmem_pmjay'),
                ('LPG Subsidy', 'receieved_subsidy_lpg'),
                ('Free Electricity', 'received_free_electricity')
            ]:
                if col in filtered_df.columns:
                    temp = (
                        filtered_df.groupby('income_quintile')[col]
                        .mean()
                        .reset_index()
                        .rename(columns={col: 'participation_rate'})
                    )
                    temp['program'] = program
                    # Convert quintile to readable label
                    temp['income_group'] = temp['income_quintile'].apply(
                        lambda x: f"Q{int(x)+1} ({['Lowest', 'Lower', 'Middle', 'Higher', 'Highest'][int(x)]})" if pd.notna(x) and x < 5 else "Other"
                    )
                    programs_by_income.append(temp)
            
            programs_by_income_df = pd.concat(programs_by_income) if programs_by_income else pd.DataFrame()
            if not programs_by_income_df.empty:
                programs_by_income_df = clean_json_values(programs_by_income_df)
        except Exception as e:
            print(f"Error in alternative income division: {e}")
            programs_by_income_df = pd.DataFrame()
    
    # Prepare response
    response = {
        "programParticipation": program_participation,
        "programsByState": programs_by_state_df.to_dict('records') if not programs_by_state_df.empty else [],
        "programsBySocialGroup": programs_by_social_df.to_dict('records') if not programs_by_social_df.empty else [],
        "programsVsExpenditure": programs_vs_expenditure.to_dict('records') if not programs_vs_expenditure.empty else [],
        "rationUsage": ration_usage.to_dict('records') if not ration_usage.empty else [],
        "topBottomStates": top_bottom_states,
        "programsBySector": programs_by_sector_df.to_dict('records') if not programs_by_sector_df.empty else [],
        "programsByIncome": programs_by_income_df.to_dict('records') if not programs_by_income_df.empty else []
    }
    
    return response
@app.get("/api/household-size-analysis")
async def get_household_size_analysis(state: Optional[str] = None):
    """Get analysis of how household size impacts expenditure"""
    if not hasattr(app.state, 'df') or app.state.df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = app.state.df
    
    # Filter by state if provided
    if state and state != 'All India':
        df = df[df['state'] == state]
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for state: {state}")
    
    # Group households with 6 or more members
    df['hh_size_group'] = df['hh_size'].apply(lambda x: '6+' if x >= 6 else str(int(x)))
    
    # Calculate average expenditure by household size
    expenditure_by_size = (
        df.groupby('hh_size_group')['household_reported_monthly_exp']
        .mean()
        .reset_index()
        .rename(columns={
            'hh_size_group': 'size',
            'household_reported_monthly_exp': 'expenditure'
        })
    )
    
    # Calculate per capita expenditure
    for i, row in expenditure_by_size.iterrows():
        if row['size'] == '6+':
            # Estimate average size for 6+ group
            avg_size = df[df['hh_size'] >= 6]['hh_size'].mean()
            expenditure_by_size.at[i, 'perCapitaExpenditure'] = row['expenditure'] / avg_size
        else:
            expenditure_by_size.at[i, 'perCapitaExpenditure'] = row['expenditure'] / int(row['size'])
    
    # Sort by household size
    size_order = {'1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6+': 5}
    expenditure_by_size['order'] = expenditure_by_size['size'].map(size_order)
    expenditure_by_size = expenditure_by_size.sort_values('order').drop('order', axis=1)
    
    return expenditure_by_size.to_dict('records')

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)