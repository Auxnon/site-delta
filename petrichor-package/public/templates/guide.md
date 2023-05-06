# Preface

An important thing to keep in mind is all commands are in shorthand to minimize the characters needed to execute a game or program. This is a design choice that allows for compact code that's easy to share. Mapping the builtin commands to longer ones is simple to achieve but won't be included by default.

Consider that some command naming takes on a role of "setting" a value or data, like `mod` sets model, `img` sets an image, `tile` sets a tile, etc. The retrieval or "getting" you can think of as get model, or `gmod`, get image or `gimg`.

## terminal

- new < path > - creates a new game example at path
- load < path > - loads an app file
- pack < path > - packs a directory into an app file
- unpack < file > - unpacks an app file into a zip archive
- ls - show directory contents relative to home
- show - open current app folder or file
- config - create config or show if already exists
- exit - exit to boot menu
- reload - reloads game, or press Super + R
- atlas - dump texture atlas to png
- dev - toggle dev mode this session
- clear or cls - clear the console
- bg < color > - set console background color
- find < name > - loaded assets search
- stats - show stats
- notif < message > - make a notification (debug)
- bundles - list active bundles
- help - display these console commands
- version - show engine and codex versions

---

# io

## key

_check keyboard key_

```lua
---@type fun(name:string, volatile?:boolean):boolean
function key(name)
```

Passing a case insenstive string representing a single keyboard character will return whether it's currently held down or not. Including an optional boolean of true will return a whether the key is pressed during a single game tick, then that key must be released before it can be detected again. This is useful when you're concerned with a single tap without adding checks on if a key was pressed in a previous tick.

If a key can be typed to represent itself as a symbol this is how the key is checked, such as ";" for the semicolon key. left and right duplicate keys are available as, for instance, "lctrl" and "rctrl" for left and right control.

```lua
if key("w") then -- valid as long as key is pressed down
    forward()
end

if key("space",true) then  -- works once then must release key to detect again
    jump()
end
```

---

## mus

_check mouse_

```lua
---@type fun()
function mus()
```

Returns an object representing all mouse data

- `x` - x position from 0 to 1 across screen represents far left to far right
- `y` - y position from 0 to 1 represents top to bottom edges
- `m1` - mouse button 1 pressed, usually left
- `m2` - mouse button 2 pressed, usually right
- `m3` - mouse button 3 pressed, usually middle

- `dx` - delta x represents change between ticks
- `dy` - delta y represents change between ticks
- `vx` - X field for screen space un-transformed to a ray that can be used for aligning or firing objects from camera. Bullets, picking, etc.
- `vy` - same for Y
- `vy` - same for Z
- `scroll` - scroll delta from -1 to 1

```lua
m=mus()

if m.scroll >0 then
scroll_up(m.scoll)
end

if m.m1 then
fire()
end
```

---

## btn

_check button_

```lua
---@type fun(button:string):boolean
function btn(button)
```

Provides the ability to check for button presses on a connected gamepad. The library, gilrs, is fairly expansive and should be plug and play on any operating system, including SteamOS. Currently there isn't any easy way of determining a good keyboard layout for this so the best option is to check for both a button and a key press with a logical `OR`.

- **south** the southern button on right side
- **north** the northern button on the right side
- **east** the eastern button on the right side
- **west** the western button on the right side
- **dleft** the left directional button
- **dright** the right directional button
- **dup** the up directional button
- **ddown** the down directional button
- **laxisx** the left analog stick's x axis
- **laxisy** the left analog stick's y axis
- **raxisx** the right analog stick's x axis
- **raxisy** the right analog stick's y axis
- **lstick** the left analog stick's center button
- **rstick** the right analog stick's center button
- **rtrigger** the right trigger
- **ltrigger** the left trigger
- **rbumper** the right bumper
- **lbumper** the left bumper
- **start** the start button
- **select** the select button

```lua
if btn("south") then
    jump()
end
```

---

## abtn

_check analog button_

```lua
--- @type fun(button:string): number
function abtn(button)
```

Similar to [btn](#btn) instead of returning a simple boolean we can get the analog value between -1 and 1. Usually for joysticks this could theoretically support any controller with this level of sensitivty. A joystick will return a negative value when pulled left and if pulled towards you (down), and positive when pulled right or if pushed away (upward).

```lua
-- rough example of adding a controller deadzone
local lstick=abtn("lstick")
if lstick>0.5 or lstick<-0.5 then
    x_movement=x_movement+lstick*speed
end
```

---

## cam

_set camera_

```lua
--- x,y,z or azimuth altitude
---@type fun({pos?:number[], rot?:number[]})
function cam(params)
```

Move the camera position within the world by passing a table with an index named `pos` containing 3 numbers representing position. The vector is numeric not named, i.e. `{1,2,3}` is at x 1, y 2, z 3. To rotate the camera pass a table with an index named `rot`. The rotation system is work in progress and assumes an up vector of Z+ for now. An azimuth of 0 is X+, Tau/4 (Pi/2) is Y+. Rotate the camera on the azimuth on the z axis for the first number (rot[1]) and look up or down an altitude angle for the second number (rot[2])

```lua
cam {pos={0,0,10}} -- move to Z 10
cam({rot={pi/2}}) -- look down positive Y
cam {rot={0,-tau/8}} -- look down by 45 degrees
cam {pos={-10,0,0},rot={0,tau/4}} -- move to -10 X and look straight up
```

---

## cin

_character input_

```lua
--- @type fun():string
function cin()
```

Returns all detected key strokes on an english keyboard related that occured between the current and last game loop and returns it as a string. Will naturally ignore irrelvent characters such as escape or function keys that cannot represented as a string. Hard coded keys

```lua
message=message+cin()
```

---

## cout

_character output_

```lua
---@param ... string|number|integer|boolean|image|entity|connection|nil
function cout(...)
```

Similar to the standard print method, this will output text to the in-engine console when you press backtick/tilde. For compatability reasons, lua's default print method is overriden to call this instead.

```lua
cout "console message!"
cout("list things: ",variable,entity,image)
```

---

## conn

_set connection_

```lua
---@type fun(address:string, udp?:boolean, server?:boolean)
function conn(address, udp, server)
```

Creates a web socket to specified website or IP address. Currently uses the [MessagePack](https://msgpack.org/) protocol. Easiest way to establish a server is have a seperate instance of Petrichor64 running with the server boolean set to true. Port forwarding may be necessary depending on how users are intended to connect. The client versions of an app or game will then need to know the ip address or website it's hosted on.

You can also use this to pull data from a website directly in theory. Currently this is limited to MessagePack but other payloads like JSON will be supported in the future.

You may want to use the headless version of Petrichor64 if available, this runs without graphical interface from command line.

See [connection]()

```lua
socket=conn("192.168.1.2:3000")

```

---

## connection (userdata)

**Work In Progress**

A object representing an established, failed, or closed web socket connection.

- `socket:send(data:string)` - send data
- `socket:recv():string|nil` - recieve data, nil if nothing arrived
- `socket:test():string|nil` - check status of connection. Will return nil if active, an error message for failures, otherwise 'safe close' when closed on purpose or otherwise
- `socket:kill()` - close the connection

```
message=socket:recv()
```

---

# system

## attr

_set attribute_

```lua
---@type fun(table:table)
function attr(table)
```

Tweak monitor properties, lock mouse, disable console, etc. If there's a global attribute to be set to define, it's likely by this method. Attributes can be set by a number or a boolean. A boolean is interpreted as 1 or 0, and a number can be evalated as true if not 0, etc. Unless specified otherwise they are single values not arrays.

**Monitor**

- resolution: number - CRT screen resolution works off a single value to auto determine aspect ratio based on window size. Can differ from render pipeline's resolution.
- curvature: number
- flatness: number
- dark: number
- bleed: number
- glitch: number[] - 1-3 number array
- high: number
- low: number
- modernize: boolean - swap out CRT for an LED monitor

**Window**

- title: string - set the window's name
- fullscreen: boolean - fullscreen the window, can still be windowed again with ctrl/cmd + enter
- mouse_grab: boolean - First person style mouse grab, ungrabs while console is open
- size: integer[] - Integer array. Force the window to a certain size, this is logically based and not physically

**Misc**

- lock: boolean - Prevent the console from being open. Technically an anti-cheat but probably not
- fog: number - sets a simple draw distance based fog that fades into the skybox raster

```lua
attr({title="Your Game Or App Name Goes Here"})
attr{modernize=0} -- try default crt monitor settings
attr{fullscreen=true}
attr{fog=100.0}
```

---

## over

_load parent process_

```lua
---@type fun(app:string)
function over(app)
```

WIP

Identical to [sub](#sub) in function except it loads in a process that will take over as a parentage. Refer to [load](#load)

```lua
over("editor")
```

---

## sub

_load child process_

```lua
---@type fun(app:string)
function sub(app)
```

WIP

Operates under the same logic as the load console command. Loads another app or game while remaining in the current lua context. Currently limited to loading an app from disk. This allows overlaying of entities and tiles within the world and each acts on it's own thread. This will be used for in-engine editors in the future.

```lua
sub("test/game")
```

---

## init

_reload_

```lua
---@type fun()
function init()
```

Hard reload the current app or game, does not retain any information curretly. This is equivalent to loading from disk

```lua
init() -- 👋
```

---

## quit

_quit to boot menu_

👋

```lua
quit() --- bye bye
```

---

# assets

## tex

_set texture_

---

## anim

_set animation_

```lua
---@type fun(name:string, items:string[], speed?:integer)
function anim(name,items,speed)
```

Provide with a series of textures to create a sequence that a sprite entity can easily animate with (Could apply to a 3d mesh as well if your UVs match up). The optional speed integer is a simple multipler that currently only supports integers.

To actually use the animation you must use the anim method on an entity `entity:anim("animation")`. This has no correlation on what the entities current texture is. See (entity)[entity] for more details.

You can also set the texture of an entity manually every frame but this is needlessly more complex unless you need more granular control

> _Bonus_: You can set animations including ping-pong with a json file as outputed by an aseprite made animation. A more robust universal config format, as well as more command parameters, is still WIP

```lua
anim("walk",{"walk1","walk2","walk3"})
ent:anim("walk")
```

---

## mod

_set model_

```lua
---@alias regular_data {v:number[3][], u?:number[2][]}, i?:integer[], n?:number[3][], t:string[]}
---@alias quad_data {q:number, u?:number[2][], n?:number[3][],t:string[]}
---@alias cube_data {t:string[]}
---@type fun(asset:string, data:regular_data|quad_data|cube_data)
function mod(asset,data)
```

Create a mesh based on provided data and store as a model asset. A mesh can be created under 3 distinct types: Either fully by vertices and indices etc, as quad data with the rest interpreted via an experimental mechanism, or as a simple cube with more granular control the normal cube map.

**The standard method** passes in vertices (v) indices (i) and UVs (u). Normals(n) can be used as well but currently not rendered. Notice usage of indices can reduce redundant vertices being made. If indices are not used the system will assume the verts are being staggered by 3 and will wastefully create a mesh from that. The following creates a "card" shape that's 1.6 wide on the x axis and 2 long on the y axis with origin centered.

```lua
mod("card", {
    v = { { -0.8, -1, 0 }, { 0.8, -1, 0 }, { 0.8, 1, 0 }, { -0.8, 1, 0 } },
    i = { 0, 1, 2, 0, 2, 3 },
    u = { { 0, 0 }, { 1, 0 }, { 1, 1 }, { 0, 1 } }
    })
```

**The quad method** is done by passing a data with a q field set and is considerably simpler if not less predictable. A quad is 4 vertices, so by passing in 8 vertices we create 8 quad faces. Indices are automatic. UVs are estimated based on right hand rule, aligning the top edge to the 1st and 2nd vertices. The UV is uniformly applied and always fit rather then clipped. Estimations may not be perfect. Expect bugs. The mechanism may change in the future. The following creates a plane that's 1 wide on the X axis, and 1 tall on the Z axis.

````lua
```lua
mod("flat", {q={{0,0,0}, {1,0,0},{1,0,1},{0,0,1}}})
````

**The cube method** is the simplest of all as it's literally just re-texturing a cube by passing in texture assets directly. the texture array can be 6 in length for each face in order of Z+, X+, Y+, X-, Y-, Z-. Any omitted asset will default to the first

```lua
mod("block",{"top","right","front","left","back","bottom"})
```

---

## gmod

_get model_

---

## nimg

_new image_

```lua
---@type fun(width:integer, height:integer):image
function nimg(width,height)
```

Create new image userdata of the specified size. This image is not a texture and serves no purpose other then to be an editable raster until applied

```lua
red=nimg(16,16)
red:fill("F00")
tex("red",red)
```

---

## gimg

_get image_

---

## image (userdata)

An image instance ties to image raster userdata hosted inside the lua context. Simple draw commands can be used to edit and animate in real time and then rendered on to a texture via the `tex` command. True live editing of a texture is currently only possible by editing the `gui` and `sky` constants. These constants are always in global scope by default and called such as `gui:text("test")` or `sky:fill("F00")`. Additionally a new image can be created via `nimg` and then set to a texture via `tex` for similar effect.

> The image type is not to be confused with the `img` method on the image type itself, as it can be used independently as `img` which is really an alias for `gui:img`

### Image methods\*\*

### line

draw a 1 pixel thick line from point 1 to point 2 with optional [color](#color)

```lua
--- @field line fun(self:image, x:gunit, y:gunit, x2:gunit, y2:gunit, rgb?:rgb)
im:line(x,y,x2,y2,"f00")
```

### rect

draw a filled square at position x,y with dimensions width height

```lua
--- @field rect fun(self:image, x:gunit, y:gunit, w:gunit, h:gunit, rgb?:rgb)
im:rect(x,y,width,height,"000")
```

### rrect

marginally more expensive filled rectangle with the ability to round the edges

```lua
--- @field rrect fun(self:image ,x:gunit, y:gunit, w:gunit, h:gunit, ro:gunit, rgb?:rgb)
im:rrect(x,y,width,height,ro,"000")
```

### img

draw another image on this image

```lua
--- @field img fun(self:image, source_image:image, x?:gunit, y?:gunit)
im:img(source_image,x,y)
```

### text

draw text on the image. Font spaces automatically.

```lua
--- @field text fun(self:image, txt:string, x?:gunit, y?:gunit, rgb?:rgb)
im:text("message",x,y,"555")
```

### pixel

draw a single pixel directly on image. Not efficient. Working on a better mechanism.

```lua
--- @field pixel fun(self:image, x:integer, y:integer,rgb?:rgb)
im:pixel(x,y,{255,255,0})
```

### clr

clears the image

```lua
--- @field clr fun(self:image)
im:clr()
```

### fill

fill the image with a color

```lua
--- @field fill fun(self:image, rgb?:rgb)
im:fill("F0F")
```

### copy

clones image to a new image userdata instance

```lua
--- @field copy fun(self:image):image
im2=im:copy()
```

### raw

WIP currently just returns raw pixel data, no way to set

```lua
--- @field raw fun(self:image):integer[] image
data=im:raw()
```

---

## color (type)

```lua
---@type color number[] | integer[] | string
```

A color can be either an ununamed array of 1-4 floats or integers, or a hex string.

A float array assumes red, green, blue, alpha is passed with 0. being nothing and 1 being max. Any ommited value defaults to 0. for rgb or 1. for alpha. If integers are used instead they operate on the assumption 0 is off and 255 is the maximum value. Keep in mind then that an array of {1,1,1,1} is a different shade then {1.,1.,1.,1.}.

If you're more farmiliar with hex values (\*cough\* web developer), a string of 3-4 or 6-8 characters representing hex values can be used as well. No hash is needed, simply saying "fff" represents white, "f00" red, "0f0" green, etc. "0006" would be black at 50% alpha.

---

## gunit (type)

_graphical unit_

```lua
--- @alias gunit number | integer | string
```

The awkwardly named `gunit` type ( pronounced either G unit, gun it, or goonit depeding on how crazy you want to sound) is simply multiple ways to define the placement and size on a screen. A decimal assumes the role of a percentage while an integer is a raw pixel value. Take care to round if necessary when using dynamic parameters.

You can also use negative values to place on the opposite side of the screen

Additionally some css-like evaluation can be used by passing a string adding or subtracting different types. Either use a more literal "50%" to indicate a 50% percentage, or outright calculate "=50% -30"

More methods coming soon!

```lua
im:line(0,0,200,200) -- line from 0,0 pixels to 200,200 pixels
im:line(0.1,0,0.9,0) -- line from 10% of the image on the X position to 90% of the image
im:line("%10",0,"%90",0) -- same thing, 10% x to 90% x
im:rect("=%50 - 32","=%50 -32",64,64) --- draw 64x64 rectangle perfectly centered
```

---

## gui

_get gui draw target_

```lua
---@type image
gui
```

There are two special image instances that have direct ties to textures, editing of which will show immediately without further commands. `gui` operates on the the front screen and overlaps the 3d scene, [sky](#sky) operates on the flat skybox behind the scene.

`gui` unlike `sky` is assumed to be the default choice when draw methods such as `line` or `fill` are used. As such calling them without an image acts as an alias. For instance `line` is the same as `gui:line`

```lua
gui:fill("F00")
gui:line(0.,1.,1.,0.,"FFF") -- draw  white on gui
line(0.,0.,1.,1.,"000") -- draw black line on gui
clr() --clear gui
```

---

## sky

_get skybox draw target_

```lua
---@type image
sky
```

The counterpart to [gui](#gui), this operates on the back or skybox raster. Must specify `sky` as the caller for draw commands or will assume `gui` was intended

```lua
sky:fill("0FF")
for i=0,20 do
    sky:img(gimg("cloud"),rnd(),rnd())
-- it's faster to set gimg to a variable but oh well
end
```

---

# sprites and entities

## make

_create entity_

```lua
---@type fun(asset?:string, x?:number, y?:number, z?:number, scale?:number)
function make(asset,x,y,z,scale)
```

Create an entity instance with optional asset at position. Asset will attempt to locate a model or mesh named as such, and failing this will fallback to locating a texture with the same name instead and applying as a billboarded sprite. This is similar logic to [tile](#tile) except tile will default to a textured cube instead. Asset or texture can always be modified after the fact with the `asset` or `tex` fields. Refer to [entity](#entity) for methods.

```lua
sprite=make("example",10,0,0) -- sprite with example asset at X 10
```

---

## kill

_destroy entity_

```lua
---@type fun(ent:entity)
function kill(ent)
```

Remove an entity from the world. This must be called if an entity is dropped as their is currently no way for the renderer to know the lua instance is no longer in memory.

```lua
ent=make("example",0,0,0) -- create
kill(ent) -- remove
```

---

## lot

_group entity_

```lua
---@type fun(parent:entity, child:entity)
function lot(parent,child)
```

Groups an entity on another, offsetting on it's current position and rotation. The parent entity is reordered on the entity stack to always be called first for it's transform matrix. Keep in mind that cyclic grouping is impossible, and trying to set a child as a parent to a it's own parent anywhere on the grouping tree will reorder it and this create unpredictable results. This doesn't fail in other words just keep in mind it could get wacky if you start grouping wildly.

```lua
parent=make()
child=make()
lot(parent,child)
parent.x=10 -- child will appear at 10 X but still have relative X of 0
```

---

## entity (userdata)

Created with the [make](#make) command an entity represents either a billboarded sprite or mesh with mutable position, rotation, scale, etc.

The following fields directly modify the entity when set:

- `x: number` - X position
- `y: number` - Y position
- `z: number` - Z position
- `rx: number` - X axis rotation
- `ry: number` - Y axis rotation
- `ry: number` - Z axis rotation
- `scale: number` - Scale with 1.0 being the default
- `vx: number` - No direct correlation, a convenience field
- `vy: number` - No direct correlation, a convenience field
- `vz: number` - No direct correlation, a convenience field
- `flipped: boolean` - Simple value to flip a sprite or mesh on it's X axis, temporary solution will be deprecated in the future
- `offset: number[3]` - A positional offset to ease the usage of models with awkward origins to their use case
- `tex: string` - A means to set the texture used directly without concern of whether it's interpreted as a model or not
- `asset: string` - The same logic used on entity creation, can be interpreted as a model, and failing that will fallback to using as a billboarded plane with the named texture if found
- `id: integer` - read only. This is provided by the renderer and can always be used by the [kill](#kill) command to remove the rendered counterpart even if the lua version is lost

**Methods**

- `anim(animation: string, force?:boolean)` - set an animation created from config or via the [anim](#anim) command
- `kill` - direct [kill](#kill) usage, destroys object from the renderer

```lua
ent=make()
ent.offset={0,0,2} -- will always appear 2 units higher on the z axis then normal
ent.x=ent.x+10 -- increment x position by 10
ent.rz=tau/4 -- rotate on the z axis 45 degrees
ent.scale = 10 -- 10 times larger
ent:anim("walk") -- set walk animation, does not reset interval if already set
ent:anim("die",true) -- force animation to start at 0, necessary for animations set to once
ent.asset="cube" -- change to a cube model if available
ent.tex="grass" -- set the texture to grass if available, but will not alter a model set prior
ent:kill() -- 💀
```

---

# tile management

## tile

_set tile_

```lua
tile(asset_name,x,y,z,rotation)
```

Set a cube or defined model in the world at a position x,y,z. The provided asset string will first check for a model with the matching name that was either preloaded or defined by the the script before this method was called. If this it will then check for a texture that was preloaded or defined by script. If it only finds a texture it will create a cube textured on each side with the image.

Regardless of the asset chosen it will place it within the world with 0 rotation applied. If you desire a different orientation it's limited to facing 1 of 6 directions by providing a 4th integer to the command

0. default
1. 90 degrees on z axis
2. 180 degrees on z axis
3. 270 degrees on z axis
4. TODO
5. TODO

```lua
tile("example",1,2,3,2) --- place example asset at position 1,2,3 and rotated 180 degrees
```

---

## istile

_is tile_

---

## ftile

Coming Soon

---

## gtile

_get tile_

---

## dtile

_delete tile_

```lua
---@type fun(x?:integer, y?:integer, z?:integer)
function dtile( x, y, z) end
```

Crude deletion of a 16x16x16 chunk. Chunk is hardset at this size for now. Technically very efficient for large area tile changes. Not including arguments deletes all tiles within the world by and is the fastest way to clear the map.

```lua
dtile(0,0,0) -- remove chunk at origin
dtile(128) -- valid, evals to 128,0,0;
dtile() -- remove all chunks by dumping memory
```

---

# math

## abs

_absolute value_

```lua
---@type fun(n:number|integer):integer|number
function abs(n)
```

Return the absolute value of the provided number

```lua
abs(-1) == 1
```

---

## rou

_round value_

```lua
---@type fun(n:number):integer
function rou(n)
```

Round a value to the nearest integer

```lua
assert(ceil(0.4)==0)
assert(ceil(0.5)==1)
assert(ceil(0.6)==1)
```

---

## ceil

_ceiling value_

```lua
---@type fun(n:number):integer
function ceil(n)
```

Ceiling a value rounding up to the nearest integer

```lua
assert(ceil(0.4)==1)
assert(ceil(0.5)==1)
assert(ceil(0.6)==1)
```

---

## flr

_floor value_

```lua
---@type fun(n:number):integer
function flr(n)
```

Floor a value rounding down to the nearest integer

```lua
assert(ceil(0.4)==0)
assert(ceil(0.5)==0)
assert(ceil(0.6)==0)
```

---

## cos

_cosine value_

```lua
---@type fun(n:number):number
function cos(n)
```

Mathematical cosine function. Uses standard rust library not lua's math library. See [sin](sin) for sine.

```lua
assert(cos(pi) == -1)
assert(cos(tau) == 1)
assert( abs(1/sqrt(2) - cos(pi/4)) < 0.000000025 )
```

---

## sin

_sine value_

```lua
---@type fun(n:number):number
function sin(n)
```

Mathematical sine function. Uses standard rust library not lua's math library. See [cos](#cos) for cosine.

```lua
assert(sin(pi) == 0)
assert(abs(sin(tau))> 1e-16) -- very small margin of error
assert( sin(tau/2) - cos(pi/4)==0 ) --tau is pi*2
```

---

## pow

_ value to the power of_

```lua
---@type fun(a:number, b:number):number
function pow(a,b)
```

---

## sqrt

_squareroot value_

```lua
---@type fun(n:number):number
function sqrt(n)
```

Square root

```lua
sqrt(-1) -- Nan
assert(sqrt(2)==1.4142135623730951)
```

---

## log

_logarithmic value_

```lua
---@type fun(n:number):number
function log(n)
```

Returns the base 10 logarithmic value of the parameter

```lua
assert(log(10)==1)
assert(log(100)==2)
```

---

## rnd

_random floating point value_

```lua
---@type fun(a?:number, b?:number):number
function rnd(a, b) end
```

Returns a random number either between a provided range betwen parameters A and B, a single parameter A from 0. - A, or with no parameters returns 0. - 1.

```lua
rnd(-5,5) -- -5.0 to 5.0
rnd(100) -- 0.0 to 100.0
rnd() -- 0.0 through 1.0
```

---

## irnd

_random integer_

```lua
---@type fun(a?:integer, b?:integer):integer
function irnd(a, b) end
```

Identical to [rnd](#rnd) except always returns an integer.

```lua
rnd(-5,5) -- -5 to 5
rnd(1,20) -- D20
rnd(100) -- 0 to 100
rnd() -- -9,223,372,036,854,775,807 to 9,223,372,036,854,775,807
```

---

# sound

## note

_play note_

```lua
---@type fun(freq:number, length?:number)
function note(freq,length)
```

**WIP**

Play a note of the specified frequency in hertz with the current instrument of an optional length. a parameter of 440.0 for instance represents 440 hertz or A above middle C in the 4th harmonic. All sound occupies it's own thread independent of all other processes.

```lua
note(110.0) -- play A1
```

---

## song

_asynchronous note sequence_

```lua
---@type fun(data:{freq:number,len?:number}[] | number[])
function song(data)
```

**WIP**

Play a series of notes similar to [note](#note) command. Can pass in an array of numbers for the frequencies, or an array of 2 numbers as an array nested.

As sound is an independent thread, sending notes as a sequence with a single command is more likely to stream without break or interruption.

---

## instr

_set instrument_

---

## mute

_stop sound channel_

```lua
---@type fun(n?:integer)
function mute(n)
```

mute sound channel

---

# misc

## help

_list commands_

```lua
---@type fun(expand?:boolean):table
function help(expand)
```

List all commands in a key pair format, such that resulting table you can find `table["cos"]` is the description for the `cos` command. Passing in a true boolean will have the resulting table list an array including the annotation comments used for the `ignore.lua` file a LSP consumes for typing and function defintions.

```lua
help()["cos"] -- "Cosine value"
help(true)["cos"] -- {"Cosine value", "---@param f number \n ---@return number\n ..."}
```

---

