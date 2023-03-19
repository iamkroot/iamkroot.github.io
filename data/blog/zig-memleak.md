---
title: 'The Curious Case of a Memory Leak in a Zig program'
date: '2023-03-18'
lastmod: '2023-03-18'
tags: ['zig', 'debugging', 'memory']
draft: false
summary: "Digs into a unexpected memory leak when using Zig's FixedBufferAllocator"
images: []
authors: ['default']
layout: PostLayout
hn: ['https://news.ycombinator.com/item?id=35216075']
---

This is a small exposition on an unexpected "memory leak" I encountered when writing a Zig program. We will mainly focus on a very simple allocation pattern and see how it causes a "leak" (you will see why I am putting it in quotes) when using a particular allocator from Zig's stdlib.

# Zig

[Advent of Code 2022](https://adventofcode.com/2022/) gave me an excuse to learn the [Zig programming language](https://ziglang.org/). It is touted to be _the_ C replacement, so I definitely expected to write lots of low-level code involving pointers and manual memory management. But the language is designed around making such code safe and ergonomic. I particularly liked how virtually every allocation requires an _explicit_ memory allocator, and that the Zig standard library ships with many allocator types that we would need for common memory usage patterns.

As a personal challenge, I strived to explicitly limit the amount of memory needed for solving each AoC problem to something that fits on the stack (typically a few MBs at most).

# Enter `FixedBufferAllocator`

The `FixedBufferAllocator` from Zig's standard library is a perfect fit for my challenge constraint. Here's a refresher:

```zig
// from https://ziglearn.org/chapter-2/#allocators
test "fixed buffer allocator" {
    var buffer: [1000]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&buffer);

    const allocator = fba.allocator();

    const memory = try allocator.alloc(u8, 100);
    defer allocator.free(memory);

    try expect(memory.len == 100);
    try expect(@TypeOf(memory) == []u8);
}
```

The allocator is backed by a bytearray of fixed length (`1000` bytes in the snippet above) which is allocated on the stack. It keeps allocating memory from the slice until it hits the end, at which point it returns a `OutOfMemory` error. [^oom]

Enough background, let's dive into the primary reason this post was made.

# Day 23

The problem statement of [AoC'22 Day 23](https://adventofcode.com/2022/day/23) is similar to Conway's Game of Life, except with different rules. The details of the problem aren't important — it comes down to simulating an infinite grid of cells in 2D space for a certain number of steps, where each "active" cell interacts with its neighbours in every iteration according to certain rules.

Next I'll be describing some relevant portions of my solution. Pause here if you wish to take a shot at the [problem](https://adventofcode.com/2022/day/23) yourself first!

As an implementation detail, an infinite grid means we can't use a traditional 2D array data structure in a very straightforward way. As a starting point, I elected to simply use a hashset to store the `(x,y)` coordinates of all the cells that are "active" in the grid in the current step. [^dyn]

```zig
const Point2D = struct {
	x: i32,
	y: i32,
};

/// type alias to specify HashSet of active cells in 2D space
const CellSet = std.AutoHashMap(Point2D, void); // zig stdlib doesn't have an explicit "HashSet"; we can instead use a hashmap with `void` as its value type

const Grid = struct {
	cells: CellSet,
};
```

The data structures are pretty self-explanatory I hope. I chose to wrap `cells` inside a `Grid` just in case I needed to store other auxiliary data. Turned out to be unnecessary, but let's continue with this for now.

We need to run the simulation for certain number of iterations, updating the `grid` each time:

```zig
fn main() !void {
	var buffer: [20000]u8 = undefined;
	var fba = std.heap.FixedBufferAllocator.init(&buffer);
	const allocator = fba.allocator();

	// parsing code
	...

	for(0..numSteps) |i| {
	    std.debug.print("Round {}\n", .{ i });
	    try step(grid);
	}
	// print result
}
```

# The `step` function

The core part is a repated call to the `step` function. It takes the grid state (set of active cells) and basically applies the interaction rules to update the locations of active cells.

```zig
fn step(grid: *Grid) !void {
	// initialize the new cell hashset to use the same allocator as old cells
	var new_cells = CellSet.init(grid.cells.allocator);
	// allocate mem
	try new_cells.ensureTotalCapacity(grid.cells.count());

	// populate the new_cells according to game rules
	...

	// replace the old cells set with new_cells
	grid.cells.deinit(); // free old hashset
	grid.cells = new_cells; // set pointer
}
```

The key insight here is that the game rules ensure that the number of active cells remains constant throughout. As a side note, Zig lets us take advantage of this with the `new_cells.ensureTotalCapacity` call. Our algorithm can guarantee that there will be no allocations needed when actually inserting elements into this set, preferring to call `CellSet.putAssumeCapacity`, and the like [^tigerbeetle].

We can go one _step_ further (pun intended :3), and assert that the amount of memory allocated before and after every invocation of `step` is the same. This is because we make sure that the old hashset is freed before we exit the function. So, we are done... Right?

# The Leak

Alas, we get an `OutOfMemory` error after a few calls to `step` when running on the provided input (~2500 active cells). My solution started with the `FixedBufferAllocator` backed by a modest `20KB` buffer. At its peak, we need to store 2 hash sets in memory (just before we free the old one at end of `step`). Maybe the hashsets really take up more than `20KB`?

So my first instinct was to increase the buffer size. But this does not work. What's more, increasing it all the way up to a few MBs is still not enough- each time we can make a few more calls to `step` than before, but eventually it gives `OutOfMemory`. This really goes against the "no extra memory" assertion we made about `step`.

There is a memory leak.

# Investigation

\[Cut- some hours of head-bashing to figure out just _how_ the old hashtables were being leaked. Why isn't `deinit` working??\]

After coming to the conclusion that the `deinit` is doing its job just fine and frees the old hashset, I had to look for the leak elsewhere.

I started to use a _different_ allocator for `new_cells`:

```zig
fn step_with_tempalloc(grid: *Grid) !void {
	var temp_buf: [40000]u8 = undefined;
	var temp_fba = std.heap.FixedBufferAllocator.init(&temp_buf);
    const temp_alloc = temp_fba.allocator();

	// initialize the new cell hashset to use the temp_alloc
	var new_cells = CellSet.init(temp_alloc);
	// allocate mem
	try new_cells.ensureTotalCapacity(grid.cells.count());

	// populate the new_cells according to game rules, same as before
	...

	// can't do this anymore
	// grid.cells.deinit(); // free old hashset
	// grid.cells = new_cells; // set pointer

	grid.cells.clearRetainingCapacity();
	// helper func can assume that no allocations will be needed
	copyHashTable(new_cells, &grid.cells);
	// temp_buf is out of scope, new_cells is invalidated. no need to free it manually
}
```

Now, we allocate `new_cells` in a temporary allocator for every iteration, and copy it over to `grid.cells` at the end. Implementation detail- Now we cannot simply "swap pointers" and set the `grid.cells` field as we did before, since `new_cells` will be invalidated once the function exits. We need to manually copy over all the entries from `new_cells` into `grid.cells`.

It worked!! We could stop now, but this solution feels suboptimal. Can't we avoid the hash table copy somehow? Let's try to debug our old code.

One thing we can do is ask the `fba` how much memory it has allocated[^lsp]-

```zig
    ...
	copyHashTable(new_cells, &grid.cells);

    std.debug.print("new_cells memuse: {}\n", .{temp_fba.end_index});
}
```

This always printed the same number (`36888` in my case) across different runs of `step`, meaning the `new_cells` hashset is always the same size. This further supports our assertion that total memory is constant across `step` calls. Then why did the original `step` leak?!!

Wait a minute...

.

.

`end_index` is an interesting name for a variable... Why not call it `allocated_bytes`, or something?

AHA!

# Cause

After reading the [source code of `FixedBufferAllocator`](https://github.com/ziglang/zig/blob/c31007bb47a4d1d62917324a33e9a9a6cd1df5a6/lib/std/heap.zig#L365), it becomes clear why the `step` function leaked. Let us dig in.

The allocator state consists of only two fields-

```zig
pub const FixedBufferAllocator = struct {
    end_index: usize,
    buffer: []u8,

    ...
}
```

The `buffer` is the backing slice of bytes (made of a `u8` pointer and `usize` length), and `end_index` is the last byte that has been allocated till now.

To realize how unsophisticated this is, here is the [implementation of `free`](https://github.com/ziglang/zig/blob/c31007bb47a4d1d62917324a33e9a9a6cd1df5a6/lib/std/heap.zig#L458-L472)-

```zig
fn free(
    ctx: *anyopaque,
    buf: []u8,
    log2_buf_align: u8,
    return_address: usize,
) void {
    const self = @ptrCast(*FixedBufferAllocator, @alignCast(@alignOf(FixedBufferAllocator), ctx));
    _ = log2_buf_align;
    _ = return_address;
    assert(self.ownsSlice(buf)); // sanity check

    if (self.isLastAllocation(buf)) {
        self.end_index -= buf.len;
    }
}

pub fn isLastAllocation(self: *FixedBufferAllocator, buf: []u8) bool {
    return buf.ptr + buf.len == self.buffer.ptr + self.end_index;
}
```

Don't worry about all the extra cruft. The core part is in these lines-

```zig
if (self.isLastAllocation(buf)) {
    self.end_index -= buf.len;
}
```

Geddit?

The `end_index` is only decremented if the memory to be freed is at the end of the allocated region. Put another way, the allocator behaves like a stack. You can only `free` the most recently allocated slice first. Otherwise `free` is a no-op.

To verify, let's take one _step_ back (sorry, I just couldn't help myself :3), and print the "memory usage" for our original version of `step`-

```zig
// in main loop
for(0..numSteps) |i| {
    std.debug.print("Round {} memuse: {}\n", .{ i, fba.end_index });
    try step(grid);
}
```

Output:

```
Round 0 memuse: 41864
Round 1 memuse: 78752
Round 2 memuse: 115640
Round 3 memuse: 152528
Round 4 memuse: 189416
Round 5 memuse: 226304
Round 6 memuse: 263192
Round 7 memuse: 300080
Round 8 memuse: 336968
Round 9 memuse: 373856
```

Yep, after each round the `end_index` is incremented by `36888` (`=78752-41864`), which is exactly the size of `new_cells` we got from `step_with_tempalloc` [^extramem].

# Visualization

I hope you are beginning to see why [our implementation of `step`](#the-step-function) was flawed. Here's some ASCII art to visualize the allocation pattern[^viz]-

```
step0
 start: [gridcells...................................]
 alloc: [gridcells|new_cells.........................]
 swap : [..........gridcells.........................]
step1
 start: [..........gridcells.........................]
 alloc: [..........gridcells|new_cells...............]
         ^new_cells should ideally have come here
 swap : [....................gridcells...............]
step2
 start: [....................gridcells...............]
 alloc: [....................gridcells|new_cells.....]
 swap : [..............................gridcells.....]
... so on, until we hit end of buffer
```

(The chunks of `.` represent uninitialized/unused memory in the buffer.)

Since we always allocated `new_cells` _before_ freeing `grid.cells`, the new hashset was always placed after the old one in the backing buffer. The calls to `grid.cells.deinit()` were thus hitting the no-op case of `free` since `grid.cells` was not the last allocation in that buffer.

There you have it...

# Fix

There are many ways to fix the memory leak. I will only outline some of the most obvious solutions here-

1. Keep the `step_with_tempalloc` implementation. It is totally fine to do some extra copies, as it is only a constant overhead.
2. To use the original version of `step` (no extra copies), we could switch to a more sophisticated allocator (like `std.heap.page_allocator`) that is capable of releasing memory from anywhere, not just the end.
3. If you are hell-bent on using `FixedBufferAllocator` only _and_ you want to avoid copies, there is a way. Using two buffers (and separate allocators backed by them), it is possible to keep swapping between them after every iteration. Try drawing the visual diagram to see why it would work!

# Closing thoughts

- Now you can appreciate why I put "leak" in quotes at the very beginning. Since we are using a `FixedBufferAllocator`, we can't call this a "leak" in a traditional sense; there is no memory being "lost" during execution. When the underlying buffer is freed, we do end up releasing all the memory we acquired. More appropriate to call it a [Space Leak](https://queue.acm.org/detail.cfm?id=2538488).
- Both `CellSet.deinit` and `FixedBufferAllocator.free` were doing the right thing in isolation. The bug was in my particular usage of the memory allocator. And this leads us to-
- _Zig's `FixedBufferAllocator`, as it is currently implemented, is meant to be used like a stack (Last In, First Out)_. Deviate from this at your own peril.

I am sure I have been abusing `FixedBufferAllocator` to make it do much more than intended (which probably involved keeping it in a single function scope, useful for simple allocs). But hey, I had a lot of fun pushing the boundaries and discovering how it broke. I hope this was useful for you too!

[^oom]: Upon hitting the `OutOfMemory`, I would do one (or more) of three things-

    1.  Easy: increase the buffer size until the error disappears. This works upto a point, but is obviously bound by the stack limits set on the system (`8MB` by default on most linux systems; you can check using `ulimit -s`)
    2.  Difficult: come up with a better algorithm that doesn't need so much memory.
    3.  Cop-out: If I was feeling particularly lazy, or if the solution genuinely needed lots of memory (as in some memoized algos), I would simply shift from `FixedBufferAllocator` to the `std.heap.page_allocator`. As the name suggests, it is essentially the generic OS allocator that is backed by pages (typically 4KB each) in the heap, allowing me to utilize all the available RAM on my system.

[^dyn]: We _could_ use the 2D-array solution by performing dynamic re-sizing when a cell crosses the allocated boundaries, but that would be too much effort for now. Might switch to it if the naive hashset solution starts causing issues with performance (random hash lookups vs adjacent cell accesses). Or, if we were really following Conway's Game of Life rules, we could go all-out and implement something like [Hashlife](https://en.wikipedia.org/wiki/Hashlife).
[^tigerbeetle]: [TigerBeetle](https://tigerbeetle.com/) takes this to a whole another level; see [A Database Without Dynamic Memory Allocation](https://tigerbeetle.com/blog/a-database-without-dynamic-memory/) for more.
[^lsp]: Big thanks to [zls](https://github.com/zigtools/zls) for making it possible to enumerate all the fields of a struct. Without it, I would have had a much harder time tracking down this leak.
[^extramem]:
    For those wondering why it is `41864` and not `36888` for the very first iteration, that's because the extra space is taken up by the problem's raw input data itself. It is loaded from disk and then parsed into the `CellSet` initially, after which it is never used again.

    ```zig
    fn main() !void {
    	...
    	// call helper function that reads the data file to a []const u8 allocated using `allocator`
    	const input = try readInput(allocator, "day23.txt");
    	var grid = try Grid.parse(allocator, input);
    	...
    }
    ```

    One could get greedy and call `allocator.free(input)` as soon as the `Grid` has been populated. I leave it to you to figure out why this would not work as expected, and why we would still see `41864` being printed.

[^viz]: Of course, a hashset needs to store some metadata too. I am omitting all this from the diagram for the sake of simplicity.
