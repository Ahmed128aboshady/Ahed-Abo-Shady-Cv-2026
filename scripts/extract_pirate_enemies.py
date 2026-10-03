import os
import UnityPy
import trimesh
import numpy as np
from PIL import Image
import io

apk_data = r"C:\Users\Video Editor\Downloads\New folder (27)\apk_unpacked\assets\bin\Data\data.unity3d"
tex_dir = r"C:\Users\Video Editor\Downloads\New folder (27)\extracted_assets\textures"
out_dir = r"F:\Antigravity\Workspaces\folio-2025\static\models"

print("Loading Unity package...")
env = UnityPy.load(apk_data)

extracted_objs = {}
target_meshes = [
    '06_Galleon_Pirate',
    '05_Frigate_Pirate',
    '05_Frigate_Sails',
    '03_Brigantine_Pirate',
    '03_Brigantine_Sails',
    'LootChestGold',
    'Rock01',
    'Rock02'
]

for obj in env.objects:
    if obj.type.name == 'Mesh':
        data = obj.read()
        if data.m_Name in target_meshes:
            print(f"Exporting mesh: {data.m_Name}")
            extracted_objs[data.m_Name] = data.export()

print(f"Extracted {len(extracted_objs)} meshes.")

# Common texture
tex_main_path = os.path.join(tex_dir, "texture main.png")
img_main = Image.open(tex_main_path) if os.path.exists(tex_main_path) else None

def create_pbr_material(tex_name):
    tex_path = os.path.join(tex_dir, tex_name)
    if os.path.exists(tex_path):
        img = Image.open(tex_path)
    elif img_main:
        img = img_main
    else:
        return None
    return trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.7,
        metallicFactor=0.1,
        baseColorTexture=img
    )

R = trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0])

# 1. Galleon
if '06_Galleon_Pirate' in extracted_objs:
    mesh = trimesh.load(io.BytesIO(extracted_objs['06_Galleon_Pirate'].encode('utf-8')), file_type='obj')
    mesh.apply_transform(R)
    mesh.apply_transform(trimesh.transformations.scale_matrix(0.14))
    bounds = mesh.bounds
    mesh.apply_transform(trimesh.transformations.translation_matrix([-(bounds[0][0]+bounds[1][0])/2, -bounds[0][1] + 0.35, -(bounds[0][2]+bounds[1][2])/2]))
    mat = create_pbr_material('06_Galleon_Pirate.png')
    if mat:
        mesh.visual.material = mat
    scene = trimesh.Scene()
    scene.add_geometry(mesh, node_name="galleon", geom_name="galleon")
    scene.export(os.path.join(out_dir, "pirate_galleon.glb"))
    print("Saved pirate_galleon.glb")

# 2. Frigate
if '05_Frigate_Pirate' in extracted_objs:
    hull = trimesh.load(io.BytesIO(extracted_objs['05_Frigate_Pirate'].encode('utf-8')), file_type='obj')
    hull.apply_transform(R)
    hull.apply_transform(trimesh.transformations.scale_matrix(0.14))
    bounds = hull.bounds
    T = trimesh.transformations.translation_matrix([-(bounds[0][0]+bounds[1][0])/2, -bounds[0][1] + 0.35, -(bounds[0][2]+bounds[1][2])/2])
    hull.apply_transform(T)
    mat = create_pbr_material('05_Frigate_Pirate.png')
    if mat:
        hull.visual.material = mat
        
    scene = trimesh.Scene()
    scene.add_geometry(hull, node_name="frigate", geom_name="frigate")
    
    if '05_Frigate_Sails' in extracted_objs:
        sails = trimesh.load(io.BytesIO(extracted_objs['05_Frigate_Sails'].encode('utf-8')), file_type='obj')
        sails.apply_transform(R)
        sails.apply_transform(trimesh.transformations.scale_matrix(0.14))
        sails.apply_transform(T)
        if mat:
            sails.visual.material = mat
        scene.add_geometry(sails, node_name="sails", geom_name="sails")
        
    scene.export(os.path.join(out_dir, "pirate_frigate.glb"))
    print("Saved pirate_frigate.glb")

# 3. Brigantine
if '03_Brigantine_Pirate' in extracted_objs:
    hull = trimesh.load(io.BytesIO(extracted_objs['03_Brigantine_Pirate'].encode('utf-8')), file_type='obj')
    hull.apply_transform(R)
    hull.apply_transform(trimesh.transformations.scale_matrix(0.14))
    bounds = hull.bounds
    T = trimesh.transformations.translation_matrix([-(bounds[0][0]+bounds[1][0])/2, -bounds[0][1] + 0.35, -(bounds[0][2]+bounds[1][2])/2])
    hull.apply_transform(T)
    mat = create_pbr_material('03_Brigantine_Pirate.png')
    if mat:
        hull.visual.material = mat
        
    scene = trimesh.Scene()
    scene.add_geometry(hull, node_name="brigantine", geom_name="brigantine")
    
    if '03_Brigantine_Sails' in extracted_objs:
        sails = trimesh.load(io.BytesIO(extracted_objs['03_Brigantine_Sails'].encode('utf-8')), file_type='obj')
        sails.apply_transform(R)
        sails.apply_transform(trimesh.transformations.scale_matrix(0.14))
        sails.apply_transform(T)
        if mat:
            sails.visual.material = mat
        scene.add_geometry(sails, node_name="sails", geom_name="sails")
        
    scene.export(os.path.join(out_dir, "pirate_brigantine.glb"))
    print("Saved pirate_brigantine.glb")

# 4. Loot Chest
if 'LootChestGold' in extracted_objs:
    chest = trimesh.load(io.BytesIO(extracted_objs['LootChestGold'].encode('utf-8')), file_type='obj')
    chest.apply_transform(trimesh.transformations.scale_matrix(0.45))
    bounds = chest.bounds
    chest.apply_transform(trimesh.transformations.translation_matrix([-(bounds[0][0]+bounds[1][0])/2, -bounds[0][1], -(bounds[0][2]+bounds[1][2])/2]))
    if img_main:
        chest.visual.material = trimesh.visual.material.PBRMaterial(roughnessFactor=0.4, metallicFactor=0.7, baseColorTexture=img_main)
    scene = trimesh.Scene()
    scene.add_geometry(chest, node_name="chest", geom_name="chest")
    scene.export(os.path.join(out_dir, "loot_chest.glb"))
    print("Saved loot_chest.glb")

# 5. Sea Rock
if 'Rock01' in extracted_objs:
    rock = trimesh.load(io.BytesIO(extracted_objs['Rock01'].encode('utf-8')), file_type='obj')
    rock.apply_transform(trimesh.transformations.scale_matrix(0.3))
    if img_main:
        rock.visual.material = trimesh.visual.material.PBRMaterial(roughnessFactor=0.9, metallicFactor=0.1, baseColorTexture=img_main)
    scene = trimesh.Scene()
    scene.add_geometry(rock, node_name="rock", geom_name="rock")
    scene.export(os.path.join(out_dir, "sea_rock.glb"))
    print("Saved sea_rock.glb")

print("All enemy models extracted and converted to GLB successfully!")
