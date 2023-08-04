---
title: 'Memory shenanigans'
date: '2023-08-04'
lastmod: '2023-08-04'
tags: ['pointers', 'C++', 'memory']
draft: false
summary: 'A gentle, example-guided introduction to pointer tagging'
images: []
authors: ['default']
layout: PostLayout
---

I will be describing an unconventional solution to a pretty standard problem involving linked lists. Along the way, we will dive into how struct fields are laid out in memory in C/C++, and exploit an interesting characteristic of memory addresses on 64-bit systems. If you are unfamiliar with the terms "data alignment" and "pointer tagging", keep reading to learn something new!

# Setup

I've been solving some problems on Leetcode in my free time, and came across [Copy List with Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer). We are asked to clone (aka, deepcopy) a singly-linked list where each node also contains a special `random` field that points to, you guessed it, a random node in the list. The original list must be unchanged at the end of the clone.

Pause now and try to tackle this yourself. Can you come up with a solution that runs in `O(n)` time (`n` = number of nodes in list) and uses constant extra space (excluding the memory for cloned list)?

# Intuition

To get a `O(1)` extra space solution, we essentially need to modify the original list (in-place) somehow to keep track of the copies of each node. This lets us access the clone of each original node in constant time. [Most](https://leetcode.com/problems/copy-list-with-random-pointer/solutions/43491/a-solution-with-constant-space-complexity-o-1-and-linear-time-complexity-o-n/) [other](https://leetcode.com/problems/copy-list-with-random-pointer/solutions/1255721/c-both-solutions-explained-clearly-hashmap-method-constant-space-method/) [solutions](https://leetcode.com/problems/copy-list-with-random-pointer/solutions/1059181/c-three-pass-o-n-0ms-beats-100-explanation-with-example/) go with inserting the copy right after the original, but I was in the mood for something fancier.

Insight: We can store the address (memory pointer) of the copied node inside the original node itself- there is enough space! Or rather, we can _make_ enough space for it...

# Pointer tagging

On a 64-bit system, memory addresses usually take up 64-bits = 8 bytes of space. But this is a convenient lie- pointers don't _really_ need so much space. Having 64-bits would be enough to reference `2**64` bytes of memory, which is around 1.6 MILLION TERABYTES. Much more RAM than a single machine typiclly has. So most operating systems cheat, and use only the lower 48 bits of the pointer- the rest are usually set to all 0s or all 1s.

![top 16 bits of pointer are 0s](/static/images/PointerTagging-pointers.svg)

See [Wikipedia](https://en.wikipedia.org/wiki/Tagged_pointer) for more info.

Coming back to our problem, we need to find a place inside `Node` where we can stash an entire additional pointer (48 bits). (Remember, we need to modify each node in-place to get an `O(1)` solution.)

We can't use `next` and `random` since those are pointers and use up at least 48 bits in their respective fields, leaving only 32 bits total - not enough.

Flipping around the problem, if we somehow had 64 bits inside `Node`, we could store the pointer in the 48 bits, and use 16 bits to store some other value.

Oh- what divine coincidence... 16 bits is more than enough to represent all the values from our problem description; the range `[-10000, 10000]` has 20001 values, which is much less than `2**16` = 65536. (Even 15 bits, with 32768 values, would work... but that is a minor detail.) Maybe we can store `val` in the unused top 16 bits of our extra pointer.

Buuut `val` is itself just an `int`, giving us a measely 32 bits. We need 64 bits to store the combination of `val` (16 bits) and the cloned pointer (48 bits). Where do we get the extra 32 bits from?

Seems like we are stuck... Or are we??

Time to dig deeper...

# Data alignment

Here's the `Node` struct as given in the problem statement:

```cpp
struct Node {
    int val;
    Node* next;
    Node* random;
};
```

Naively, one would think that our `Node` struct is just 20 bytes in size- `4`(`int val`) + `8`(`Node* next`) + `8`(`Node* random`). (`int` is 32-bits, and on a 64-bit system, a pointer typically takes up 8 bytes.)

![naive view of `Node` struct](/static/images/PointerTagging-padding.svg)

However, our compiler says `Node` is really 24 bytes wide:

```cpp
cout << sizeof(Node);  // prints 24
```

What gives?

The answer lies in how the fields inside the struct are really laid out in memory. Instead of putting them right next to each other, the compiler is free to leave some blank bytes between them. This space is called padding.

This is called data alignment, and in typical 64-bit systems, pointers are aligned to 8 bytes [^hw-align]. For `Node` struct, the compiler inserts extra 4 bytes of padding after `val` to make sure that `next` is properly aligned.

```cpp
struct RealNode {
    int val;
    char __padding[4];  // inaccessible
    Node* next;
    Node* random;
};
```

![actual layout of `Node` struct with padding](/static/images/PointerTagging-padding-with.svg)

We can take advantage of this padding to _procure_ the extra space we needed.

![It's free real estate meme](/static/images/bigfreerealestate.jpg)

# Approach

Now we have all the ingredients needed to solve the original problem. We define a separate struct `Node2` that is the same as `Node`, but with `uint64_t` for the `val` field instead of `int`. **Crucially, on most systems/compilers, this struct has the same size as `Node`.**

By casting our `Node*` pointers to `Node2*` pointers, we can access the padding bytes from the original struct. We can use pointer tagging to store both the original node value (16 bits) _and_ the additional address (48 bits) in this 64-bit field.

# Code

First, we initialize the appropriate bitmasks that we'll be using.

```cpp
// number of extra bits that are unused in the pointers.
constexpr uint64_t NUM_EXTRA_BITS = 16;
// assuming 64-bit system
constexpr uint64_t VAL_SHIFT = 64 - NUM_EXTRA_BITS; // 48
constexpr uint64_t PTR_BITS = (1ULL << VAL_SHIFT) - 1;  // 0x0000ffff_ffffffff
constexpr uint64_t VAL_BITS = (0xffffULL << VAL_SHIFT); // 0xffff0000_00000000
```

Next, we define the second node struct that can access the padding bytes.

```cpp
struct Node2 {
    uint64_t tagged;    // this field takes up 8 bytes!
    struct Node2* next; // no padding before this field
    struct Node2* random;
    ...
};

```

Time to define some getters and setters that access the appropriate bits inside `tagged` field.

```cpp
// struct Node2 {
    ...
    int get_val() const {
        return tagged >> VAL_SHIFT;
    }

    void put_val(int v) {
        // our values need to fit in 16 bits
        assert(v >= INT16_MIN && v <= INT16_MAX);
        tagged |= uint64_t(v) << VAL_SHIFT;
    }

    void* get_ptr() const {
        return (void*)(tagged & PTR_BITS);
    }

    void put_ptr(void* ptr) {
        // make sure top bits are clear!
        assert((int64_t(ptr) & VAL_BITS) == 0);
        tagged |= int64_t(ptr);
    }

    // insert both into the tagged field
    void put(void* ptr, int v) {
        // zero-ing out the field is really crucial to avoid undefined behaviour
        // without this line, we can't be sure about the contents of padding bytes
        // performing |= inside the `put_val` method would be undefined behaviour
        tagged = 0;
        put_ptr(ptr);
        put_val(v);
    }
// };
```

Very important, let's add a check to make sure our assumptions are valid.

```cpp
// the constants hardcoded up top are only valid for 64-bit systems
static_assert(sizeof(uintptr_t) == 8);
// this solution will break if the following assert is false
static_assert(sizeof(Node2) == sizeof(Node));
```

Now it is just a matter of a few `reinterpret_cast`s at the right places to switch between `Node*` and `Node2*`.

# Full Solution

<details>
<summary>
Click to view the full code of the solution.
</summary>

```cpp
Node* copyRandomList(Node* head) {
    Node *copyhead = nullptr, *copytail = nullptr;

    // Pass 1: create copy list and add tagged pointers
    for (Node* p = head; p; p = p->next) {
        auto copy = new Node(p->val);
        if (!copyhead) {
            copyhead = copy;
        }
        if (copytail) {
            copytail->next = copy;
        }
        copytail = copy;
        copy->random = p->random;
        // this is where the magic happens!
        auto* origptr = reinterpret_cast<Node2*>(p);
        // store address of copied node into the original node using pointer tagging
        origptr->put(copy, copy->val);
    }
    // Pass 2: get the addresses from tagged pointer
    for (Node* copy = copyhead; copy; copy = copy->next) {
        if (copy->random) {
            // copy->random is currently the original random node
            auto* taggedptr = reinterpret_cast<Node2*>(copy->random);
            // get the copied node from the original node
            copy->random = (Node*)taggedptr->get_ptr();
        }
    }
    // Pass 3: restore the original values
    for (Node* p = head; p; p = p->next) {
        auto* taggedptr = reinterpret_cast<Node2*>(p);
        p->val = taggedptr->get_val();
        // optionally, we could wipe the padding bytes too
        // In `Node`, they are undefined values anyway, so we leave them be.
    }
    return copyhead;
}
```

</details>

<br/>

# Bonus: Another solution

If you were following closely, you might have spotted an alternate solution which avoids using the padding bytes entirely [^packed].

Our requirements are that we need to store the 48-bit pointer somewhere inside the `Node` fields. Now note that our `next` and `random` fields are themselves pointers, so they only take up 48 bits each, leaving 16+16 = 32 bits unused. We can get another 16 bits from the upper half of `val` (again, we only need 15 bits to store all the nums between `[-10000, 10000]`).

So, by taking 16 bits from each of the three fields, we actually have enough space for our additional pointer. We just need to split it across the three fields. See if you can implement this :)

# Caveat

We should be mindful that both these solutions come with a restriction. We are heavily relying on the fact that the `val` field is constrained to be in the range `[-10000,10000]` according to the original problem description. If it needed more than 16 bits, we wouldn't have enough unused bits in `val` and there'd be no point in modifying it. We could instead use the padding bytes + 16 bits from one of the pointer fields for our purposes. [^caveat-without-padding]

# Conclusion

In general, our approach has been to inspect the possible ranges of values present in the struct and figure out clever ways of shuffling bits around to store some extra information transparently.

Understanding data alignment can help us uncover extra bytes lying around in our structs. Fun fact: Rust compiler automatically reorders the fields of your structs to minimize padding. This is why you need to add a `#[repr(C)]` to avoid this and keep the padding.

Pointer tagging, in its general form, is an even more arcane trick where we take advantage of out-of-range bit patterns to store extra information in a field. It really comes in handy when performance is of the utmost importance. Some examples:

1. [KASAN](https://docs.kernel.org/dev-tools/kasan.html): Pointers can be tagged to catch memory safety violations.
2. [NaN Boxing](https://anniecherkaev.com/the-secret-life-of-nan): Used in many compilers and language runtimes to store other data types within `NaN` values of a `double`.
3. [Smallstring optimization](https://devblogs.microsoft.com/oldnewthing/20230803-00/?p=108532): Can help avoid heap allocations for small strings.

# Epilogue

Instead of simply defining what "data alignment" and "pointer tagging" are, I wanted to provide an actual use-case where they could be used to tackle a problem. Specifically, one that does _not_ require coding a compiler/stdlib/kernel first. This article was deliberately kept light on details, such as how to deal with the possibly undefined behaviour of padding bytes, and the performance implications of data alignment. We have only seen the tip of the iceberg. I hope this post was interesting enough to motivate you to explore more by yourself!

# Next up

There is yet another ~wacky~ clever solution for the original problem. Next time we will become objectively faster than the conventional solutions by requiring only two passes over the nodes (instead of the three passes needed today). We can achieve this by never modifying the fields of the original `Node`s, thus avoiding the third "restore" pass on the original list. How? Tune in next time to learn about pointer compression!

[^hw-align]: At this point, you should be asking: "But why? Why are pointers aligned to 8 bytes?" The short answer is- because the hardware (our memory bus) wants them to be. It can only address data in increments of 8, and unaligned accesses can be much slower. [This article](<https://learn.microsoft.com/en-us/previous-versions/ms253949(v=vs.90)>) gives a good overview. Also see [Wikipedia](https://en.wikipedia.org/wiki/Data_structure_alignment) for more details.
[^packed]:
    Why would this be needed, you ask? The programmer can opt out of padding fields by declaring the struct with the `packed` attribute.

    ```cpp
    struct Node {
        int val;
        Node* next;
        Node* random;
    } __attribute__((packed));

    // no padding after val field
    static_assert(sizeof(Node) == 20);
    ```

    Beware- if you are using some library, the developer can add this attribute to their structs (though, it would be considered a major change under semver!) and break your code.

[^caveat-without-padding]: What happens if there's no padding either? In this case we'd only have 32-bits of extra space in the struct for us to use. Fortunately, there's still a way. We will explore this next time!
