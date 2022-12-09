---
title: 'Running `ldd` can cause arbitrary code execution'
date: '2022-11-29'
type: 'Binary'
draft: false
tags: ['ELF', 'linux', 'security']
---

TIL you can craft a binary to cause arbitrary code execution when someone runs [`ldd`](<https://en.wikipedia.org/wiki/Ldd_(Unix)>) on it.

This can be done by ignoring the `LD_TRACE_LOADED_OBJECTS` set by `ldd` (you need a custom version of libc for that).

Source: [catonmat.net](https://catonmat.net/ldd-arbitrary-code-execution)
