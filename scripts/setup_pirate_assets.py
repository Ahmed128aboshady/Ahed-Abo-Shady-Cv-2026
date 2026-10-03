import os
import shutil
import trimesh
import numpy as np
from PIL import Image

workspace_dir = r"F:\Antigravity\Workspaces\folio-2025"
extracted_dir = r"C:\Users\Video Editor\Downloads\New folder (27)\extracted_assets"
mesh_src = os.path.join(extracted_dir, "meshes")
tex_src = os.path.join(extracted_dir, "textures")

hull_path = os.path.join(mesh_src, "02_Sloop_Player.obj")
sails_path = os.path.join(mesh_src, "02_Sloop_Sails.obj")
cannon_path = os.path.join(mesh_src, "Multi_Gun_Carriage_03.obj")
texture_path = os.path.join(tex_src, "texture main.png")

hull = trimesh.load(hull_path)
sails = trimesh.load(sails_path)
cannon = trimesh.load(cannon_path)

# Rotate meshes so forward is +X (Unity +Z -> +X)
R = trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0])
hull.apply_transform(R)
sails.apply_transform(R)
cannon.apply_transform(R)

# Scale
scale = 0.155
S = trimesh.transformations.scale_matrix(scale)
hull.apply_transform(S)
sails.apply_transform(S)
cannon.apply_transform(S)

# Center along X and Z, set baseline
bounds = hull.bounds
center_x = (bounds[0][0] + bounds[1][0]) / 2
center_z = (bounds[0][2] + bounds[1][2]) / 2
min_y = bounds[0][1]

# Position hull so keel is slightly below ground (submerged in water)
T = trimesh.transformations.translation_matrix([-center_x, -min_y + 0.35, -center_z])
hull.apply_transform(T)
sails.apply_transform(T)

# Texture assignment
if os.path.exists(texture_path):
    img = Image.open(texture_path)
    mat = trimesh.visual.material.PBRMaterial(
        roughnessFactor=0.7,
        metallicFactor=0.1,
        baseColorTexture=img
    )
    hull.visual.material = mat

# Create two cannons on deck (port & starboard)
cannon_scale = trimesh.transformations.scale_matrix(0.35)
cannon.apply_transform(cannon_scale)

cannon_port = cannon.copy()
R_port = trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0])
cannon_port.apply_transform(R_port)
cannon_port.apply_transform(trimesh.transformations.translation_matrix([0.2, 0.72, 0.42]))

cannon_starboard = cannon.copy()
R_starboard = trimesh.transformations.rotation_matrix(-np.pi / 2, [0, 1, 0])
cannon_starboard.apply_transform(R_starboard)
cannon_starboard.apply_transform(trimesh.transformations.translation_matrix([0.2, 0.72, -0.42]))

chassis_mesh = trimesh.util.concatenate([hull, cannon_port, cannon_starboard])

# Build scene hierarchy with proper nesting
scene = trimesh.Scene()
scene.add_geometry(chassis_mesh, node_name="chassis", geom_name="chassis")
scene.add_geometry(sails, node_name="bodyPainted", geom_name="bodyPainted")

# Dummy wheel container and nested children
dummy_box = trimesh.creation.box([0.02, 0.02, 0.02])
wheel_suspension = trimesh.creation.box([0.01, 0.01, 0.01])
wheel_cylinder = trimesh.creation.box([0.01, 0.01, 0.01])
wheel_painted = trimesh.creation.box([0.01, 0.01, 0.01])

scene.add_geometry(dummy_box, node_name="wheelContainer", geom_name="wheelContainer")
scene.add_geometry(wheel_suspension, node_name="wheelSuspension", geom_name="wheelSuspension", parent_node_name="wheelContainer")
scene.add_geometry(wheel_cylinder, node_name="wheelCylinder", geom_name="wheelCylinder", parent_node_name="wheelContainer")
scene.add_geometry(wheel_painted, node_name="wheelPainted", geom_name="wheelPainted", parent_node_name="wheelContainer")

out_glb = os.path.join(workspace_dir, "static", "vehicle", "pirateShip.glb")
glb_bytes = scene.export(file_type="glb")
with open(out_glb, "wb") as f:
    f.write(glb_bytes)

orig_default = os.path.join(workspace_dir, "static", "vehicle", "default.glb")
with open(orig_default, "wb") as f:
    f.write(glb_bytes)

orig_comp = os.path.join(workspace_dir, "static", "vehicle", "default-compressed.glb")
with open(orig_comp, "wb") as f:
    f.write(glb_bytes)

print("Exported pirateShip.glb and updated default.glb & default-compressed.glb successfully!")
