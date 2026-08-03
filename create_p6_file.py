import pandas as pd

# 1. Sample P6 Activities Data
activities_data = {
    'Activity ID': ['A1000', 'A1010', 'A1020', 'A1030', 'A1040'],
    'Activity Name': [
        'Notice to Proceed', 
        'Site Mobilization', 
        'Excavation & Earthwork', 
        'Foundation Pouring', 
        'Structural Steel Erection'
    ],
    'Activity Status': ['Completed', 'In Progress', 'Not Started', 'Not Started', 'Not Started'],
    'WBS Code': ['PROJ.1', 'PROJ.1.1', 'PROJ.1.1', 'PROJ.1.2', 'PROJ.1.2'],
    'Original Duration': [0, 10, 15, 20, 30],
    'Start Date': ['2026-01-05', '2026-01-06', '2026-01-20', '2026-02-10', '2026-03-05'],
    'Finish Date': ['2026-01-05', '2026-01-19', '2026-02-09', '2026-03-04', '2026-04-15'],
    'Budgeted Cost': [0, 15000, 45000, 85000, 120000]
}

# 2. Sample P6 WBS Data
wbs_data = {
    'WBS Code': ['PROJ.1', 'PROJ.1.1', 'PROJ.1.2'],
    'WBS Name': ['Project Construction', 'Site Preparation', 'Substructure & Structure']
}

# 3. Create Excel file with multiple P6 sheets
with pd.ExcelWriter('p6_schedule.xlsx', engine='openpyxl') as writer:
    pd.DataFrame(activities_data).to_excel(writer, sheet_name='Activities', index=False)
    pd.DataFrame(wbs_data).to_excel(writer, sheet_name='WBS', index=False)

print("Created 'p6_schedule.xlsx' successfully!")
