import bpy, math, random, os
from mathutils import Vector
random.seed(24)
OUT='D:/ai/oda-3d/assets/skeleton-warrior'
scene=bpy.data.scenes.new('Skeleton Warrior'); bpy.context.window.scene=scene
asset=bpy.data.collections.new('Warrior'); scene.collection.children.link(asset)
def mat(n,c,metal=0):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*c,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.65
 return m
bone=mat('Aged ivory',(.58,.45,.25)); tooth=mat('Teeth',(.76,.65,.41)); dark=mat('Cavities',(.025,.018,.009)); cloth=mat('Charcoal cloth',(.045,.055,.07)); fold=mat('Cloth folds',(.07,.085,.105)); blue=mat('Oxidized blue armor',(.12,.27,.32),.65); edge=mat('Worn metal edges',(.29,.37,.39),.7); steel=mat('Blade',(.43,.48,.49),.8); rust=mat('Rust',(.32,.115,.025)); leather=mat('Oxblood leather',(.24,.062,.025)); stone=mat('Basalt',(.095,.105,.12))
def finish(o,n,m):
 o.name=n
 for c in list(o.users_collection):c.objects.unlink(o)
 asset.objects.link(o)
 if m:o.data.materials.append(m)
 return o
def ell(n,p,s,m=bone,seg=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=p); o=finish(bpy.context.object,n,m); o.scale=s
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for f in o.data.polygons:f.use_smooth=True
 return o
def mesh(n,v,f,m):
 d=bpy.data.meshes.new(n); d.from_pydata(v,[],f); d.update(); o=bpy.data.objects.new(n,d); asset.objects.link(o); d.materials.append(m); return o
def tube(n,pts,r,m=bone):
 d=bpy.data.curves.new(n,'CURVE'); d.dimensions='3D'; d.resolution_u=10; d.bevel_depth=r; d.bevel_resolution=2
 s=d.splines.new('BEZIER'); s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,d); asset.objects.link(o); d.materials.append(m); return o
def longbone(n,a,b,r):
 a,b=Vector(a),Vector(b); v=b-a; tube(n,[a,a+v*.2+Vector((r*.25,0,0)),a+v*.75,b],r)
 for p in (a,b):
  for dx in (-r*.48,r*.48):ell(n+' joint',p+Vector((dx,0,0)),(r*.88,r*1.12,r*.85),bone,12,8)
def cut(obj,p,s):
 cutter=ell('cutter',p,s,None,24,16); bpy.context.view_layer.objects.active=obj
 mod=obj.modifiers.new('Carved cavity','BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=cutter; bpy.ops.object.modifier_apply(modifier=mod.name); bpy.data.objects.remove(cutter,do_unlink=True)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.88,depth=.13,location=(0,0,.065)); base=finish(bpy.context.object,'Round base',stone); mod=base.modifiers.new('Rim','BEVEL'); mod.width=.025; mod.segments=2
for i in range(16):
 a=random.random()*math.tau; r=random.uniform(.35,.79); ell('Slate',(r*math.cos(a),r*math.sin(a),.134),(random.uniform(.055,.16),.085,.012),stone,7,4)
for s in (-1,1):
 hip=(s*.20,.035,1.54); knee=(s*.38,-.015,.94); ankle=(s*.48,-.035,.28)
 longbone('Femur',hip,knee,.065); longbone('Tibia',knee,ankle,.052); longbone('Fibula',(s*.445,.055,.91),(s*.535,.035,.30),.025)
 ell('Patella',(s*.38,-.095,.94),(.085,.046,.084)); ell('Heel',(s*.48,.01,.215),(.087,.12,.067))
 for j in range(5):
  x=s*.48+(j-2)*.038; y=-.29+.028*abs(j-1); longbone('Metatarsal',(x,-.03,.225),(x,y+.055,.18),.018); longbone('Toe',(x,y+.055,.18),(x,y-.025,.174),.017)
 tube('Iliac crest',[(s*.06,.06,1.66),(s*.23,.06,1.68),(s*.29,-.025,1.55),(s*.16,-.12,1.40),(s*.055,-.13,1.46)],.058)
 tube('Pelvic arch',[(s*.23,.035,1.53),(s*.22,.10,1.39),(s*.08,.025,1.37),(0,-.10,1.44)],.038)
for i in range(13):
 z=1.54+i*.066; ell('Vertebra',(0,.115,z),(.074,.065,.038),bone,12,8); ell('Spinal process',(0,.185,z),(.03,.05,.023),bone,10,6)
for i in range(7):
 z=2.30-i*.091; w=[.235,.285,.315,.32,.30,.26,.205][i]
 for s in (-1,1):tube('Rib',[(s*.025,.13,z),(s*w*.80,.12,z+.015),(s*w,.015,z-.045),(s*w*.77,-.15,z-.12),(s*.045,-.19,z-.155)],.026 if i<5 else .022)
tube('Sternum',[(0,-.18,2.30),(0,-.215,2.12),(0,-.20,1.98)],.044)
for s in (-1,1):tube('Clavicle',[(0,-.14,2.34),(s*.20,-.11,2.37),(s*.38,.01,2.34)],.039)
for label,sh,el,wr in [('Left',(-.40,.015,2.30),(-.59,-.05,1.98),(-.22,-.37,1.86)),('Right',(.40,.015,2.30),(.52,-.015,1.98),(.10,-.37,1.88))]:
 longbone(label+' humerus',sh,el,.043); longbone(label+' radius',el,wr,.031); longbone(label+' ulna',Vector(el)+Vector((.035,.035,0)),Vector(wr)+Vector((.025,.03,0)),.023); ell('Palm',wr,(.065,.036,.078))
 for j in range(4):
  x=wr[0]+(j-1.5)*.027; tube('Curled finger',[(x,-.39,1.89),(x,-.445,1.84),(x+.012,-.46,1.79),(x+.02,-.42,1.775)],.013,tooth)
 tube('Thumb',[(wr[0]-.055,-.39,1.88),(wr[0]-.078,-.44,1.85),(wr[0]-.043,-.46,1.82)],.017)
ell('Neck',(0,.035,2.47),(.065,.065,.14))
skull=ell('Skull',(0,0,2.77),(.19,.15,.235),bone,32,24)
for s in (-1,1):
 cut(skull,(s*.081,-.143,2.755),(.064,.090,.063)); ell('Orbit shadow',(s*.081,-.097,2.755),(.049,.022,.046),dark)
 tube('Brow',[(s*.022,-.145,2.82),(s*.075,-.172,2.829),(s*.135,-.132,2.80)],.025)
 tube('Cheek arch',[(s*.153,-.077,2.77),(s*.158,-.135,2.69),(s*.095,-.17,2.67)],.024)
ell('Maxilla',(0,-.085,2.657),(.107,.093,.06))
mesh('Nose aperture',[(-.027,-.181,2.73),(.027,-.181,2.73),(.016,-.186,2.678),(-.016,-.186,2.678)],[(0,1,2,3)],dark)
tube('Jaw',[(-.137,-.05,2.69),(-.12,-.10,2.57),(-.064,-.164,2.545),(0,-.18,2.54),(.064,-.164,2.545),(.12,-.10,2.57),(.137,-.05,2.69)],.027)
ell('Mouth shadow',(0,-.12,2.604),(.097,.046,.037),dark)
for j in range(9):
 x=(j-4)*.021; y=-.180+.036*(abs(x)/.09)**2; ell('Upper tooth',(x,y,2.622),(.0095,.017,.019),tooth,10,6); ell('Lower tooth',(x,y+.001,2.589),(.009,.015,.014),tooth,10,6)
for i in range(5):
 pts=[]
 for j in range(33):
  a=math.tau*j/32; pts.append(((.235+i*.013)*math.cos(a),(.16+i*.012)*math.sin(a),2.435-i*.027+.075*math.sin(a)))
 tube('Cowl fold',pts,.036,cloth if i%2==0 else fold)
for s in (-1,1):
 v=[]; f=[]
 for row in range(7):
  t=row/6*1.65
  for j in range(17):
   a=math.tau*j/16; v.append((s*(.39+.20*math.sin(t)*math.cos(a)),.005+.18*math.sin(t)*math.sin(a),2.355+.13*math.cos(t)))
 for r in range(6):
  for j in range(16):
   a=r*17+j; f.append((a,a+1,a+18,a+17))
 o=mesh('Pauldron',v,f,blue); o.modifiers.new('Plate thickness','SOLIDIFY').thickness=.012; tube('Armor rim',v[-17:],.018,edge)
 for j in range(7):
  a=math.pi+math.pi*j/6; ell('Rivet',(s*(.39+.192*math.cos(a)),.005+.178*math.sin(a),2.35),(.012,.012,.012),edge,8,6)
for k in range(9):
 v=[]; f=[]; bottom=[.52,.64,.43,.72,.57,.67,.38,.62,.79][k]
 for r in range(13):
  t=r/12
  for j in range(4):
   u=(k+j/3)/9; x=(u-.5)*(.77+.31*t)-.12*t; y=.17+.19*t+.065*math.sin(u*math.pi*12)+.045*math.sin(t*8+u*4); z=2.40*(1-t)+bottom*t+(.055*math.sin(j*2+k) if r==12 else 0); v.append((x,y,z))
 for r in range(12):
  for j in range(3):
   a=r*4+j; f.append((a,a+1,a+5,a+4))
 o=mesh('Torn cape',v,f,cloth if k%3 else fold); o.modifiers.new('Fabric thickness','SOLIDIFY').thickness=.008
 for p in o.data.polygons:p.use_smooth=True
for k in range(4):
 x=-.26+k*.13; v=[(x,-.10,1.58),(x+.14,-.10,1.58),(x+.16,-.10,1.31),(x+.11,-.12,.94+(.17 if k%2 else 0)),(x+.03,-.14,1.04),(x-.02,-.13,1.28)]
 o=mesh('Waistcloth',v,[(0,1,2,5),(5,2,3,4)],cloth); o.modifiers.new('Thickness','SOLIDIFY').thickness=.009
tube('Belt',[(-.28,0,1.59),(-.22,-.15,1.60),(0,-.19,1.57),(.23,-.14,1.60),(.28,.03,1.59)],.038,leather)
for j in range(9):ell('Belt stud',(-.20+j*.05,-.185,1.59),(.012,.009,.012),edge,8,6)
origin=Vector((-.12,-.49,1.79)); direction=Vector((.96,0,.29)).normalized(); across=Vector((-direction.z,0,direction.x)); depth=Vector((0,1,0))
def sp(u,v,w=0):return origin+direction*u+across*v+depth*w
tube('Sword grip',[sp(-.46,0),sp(-.045,0)],.038,leather)
for i in range(13):
 p=sp(-.43+i*.029,0); tube('Grip wrap',[p+across*.039,p-depth*.04,p-across*.039],.006,rust)
ell('Pommel',sp(-.49,0),(.054,.043,.047),edge)
tube('Crossguard',[sp(0,-.18),sp(-.025,-.09),sp(0,0),sp(.025,.09),sp(0,.18)],.025,edge)
profile=[(0,.075),(.20,.10),(.85,.115),(1.30,.05),(1.47,0),(1.20,-.09),(.25,-.11),(0,-.07)]
v=[sp(u,w,0) for u,w in profile]+[sp(.65,0,-.037),sp(.65,0,.037)]; f=[]
for j in range(8):f.extend([(j,(j+1)%8,8),((j+1)%8,j,9)])
mesh('Broad sword',v,f,steel)
for i in range(46):
 u=random.uniform(.09,1.25); w=random.uniform(-.045,.05); r=random.uniform(.008,.033)
 mesh('Rust flake',[sp(u+math.cos(j*math.tau/7)*r,w+math.sin(j*math.tau/7)*r*.6,-.039) for j in range(7)],[tuple(range(7))],rust)
bpy.ops.object.select_all(action='DESELECT')
for o in list(asset.objects):
 bpy.context.view_layer.objects.active=o; o.select_set(True)
 if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 o.select_set(False)
for m in (bone,tooth,dark,cloth,fold,blue,edge,steel,rust,leather,stone):
 group=[o for o in asset.objects if o.type=='MESH' and o.data.materials[0]==m]
 if not group:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:o.select_set(True)
 bpy.context.view_layer.objects.active=group[0]; bpy.ops.object.join(); group[0].name=m.name
root=bpy.data.objects.new('SkeletonWarrior',None); asset.objects.link(root)
for o in list(asset.objects):
 if o!=root:o.parent=root
studio=bpy.data.collections.new('Studio'); scene.collection.children.link(studio)
def studio_obj(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 studio.objects.link(o)
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-8,3.5)); cam=bpy.context.object; studio_obj(cam); aim(cam,(.12,0,1.52)); cam.data.type='ORTHO'; cam.data.ortho_scale=3.60; scene.camera=cam
for n,p,power,size,color in [('Key',(-3,-4,6),650,4,(1,.86,.68)),('Fill',(4,-2,3),450,3,(.65,.80,1)),('Rim',(1,3,5),900,3,(.68,.8,1))]:
 bpy.ops.object.light_add(type='AREA',location=p); o=bpy.context.object; studio_obj(o); o.name=n; o.data.energy=power; o.data.shape='DISK'; o.data.size=size; o.data.color=color; aim(o,(0,0,1.5))
scene.world=bpy.data.worlds.new('Charcoal studio'); scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.027,.033,.042,1); scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.render.resolution_x=850; scene.render.resolution_y=1000; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.render.filepath=OUT+'/preview.png'; scene.view_settings.view_transform='AgX'
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath='D:/ai/oda-3d/public/models/skeleton-warrior.glb',export_format='GLB',use_selection=True,export_apply=True)
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/skeleton-warrior.blend')
result={'mesh_objects':sum(o.type=='MESH' for o in asset.objects),'triangles':sum(len(p.vertices)-2 for o in asset.objects if o.type=='MESH' for p in o.data.polygons)}

