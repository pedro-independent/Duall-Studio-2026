import './styles/style.css'

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Navbar Scroll Hide/Show */
function navbarScroll() {
  const nav = document.querySelector(".nav");
  let hidden = false;

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      if (self.direction === 1 && !hidden) {
        hidden = true;
        gsap.to(nav, { yPercent: -101, duration: 0.8, ease: "expo.out" });
      } else if (self.direction === -1 && hidden) {
        hidden = false;
        gsap.to(nav, { yPercent: 0, duration: 0.6, ease: "expo.out" });
      }
    }
  });
}

navbarScroll();

/* Text Reveals */
const splitConfig = {
  lines: { duration: 1, stagger: 0.08 },
  words: { duration: 0.6, stagger: 0.08 },
  chars: { duration: 0.4, stagger: 0.01 }
}

function initMaskTextScrollReveal() {
  document.querySelectorAll('[data-split="heading"]').forEach(heading => {
    const type = heading.dataset.splitReveal || 'lines'
    const typesToSplit =
      type === 'lines' ? ['lines'] :
      type === 'words' ? ['lines','words'] :
      ['lines','words','chars']
    
    SplitText.create(heading, {
      type: typesToSplit.join(', '),
      mask: 'lines',
      autoSplit: true,
      linesClass: 'line',
      wordsClass: 'word',
      charsClass: 'letter',
      onSplit: function(instance) {
        const targets = instance[type]
        const config = splitConfig[type]
        
        return gsap.from(targets, {
          yPercent: 110,
          duration: config.duration,
          stagger: config.stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: heading,
            start: 'clamp(top 75%)',
            once: true
          }
        });
      }
    })
  })
}

  let headings = document.querySelectorAll('[data-split="heading"]')
  
  headings.forEach(heading => {
    gsap.set(heading, { autoAlpha: 1 })
  });

initMaskTextScrollReveal()

/* Content Reveal on Scroll */
function initContentRevealScroll(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = gsap.context(() => {

    document.querySelectorAll('[data-reveal-group]').forEach(groupEl => {
      // Config from attributes or defaults (group-level)
      const groupStaggerSec = (parseFloat(groupEl.getAttribute('data-stagger')) || 100) / 1000; // ms → sec
      const groupDistance = groupEl.getAttribute('data-distance') || '2em';
      const triggerStart = groupEl.getAttribute('data-start') || 'top 75%';

      const animDuration = 0.8;
      const animEase = "expo.out";

      // Reduced motion: show immediately
      if (prefersReduced) {
        gsap.set(groupEl, { clearProps: 'all', y: 0, autoAlpha: 1 });
        return;
      }

      // If no direct children, animate the group element itself
      const directChildren = Array.from(groupEl.children).filter(el => el.nodeType === 1);
      if (!directChildren.length) {
        gsap.set(groupEl, { y: groupDistance, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: groupEl,
          start: triggerStart,
          once: true,
          onEnter: () => gsap.to(groupEl, { 
            y: 0, 
            autoAlpha: 1, 
            duration: animDuration, 
            ease: animEase,
            onComplete: () => gsap.set(groupEl, { clearProps: 'all' })
          })
        });
        return;
      }

      // Build animation slots: item or nested (deep layers allowed)
      const slots = [];
      directChildren.forEach(child => {
        const nestedGroup = child.matches('[data-reveal-group-nested]')
          ? child
          : child.querySelector(':scope [data-reveal-group-nested]');

        if (nestedGroup) {
          const includeParent = child.getAttribute('data-ignore') === 'false' || nestedGroup.getAttribute('data-ignore') === 'false';
          slots.push({ type: 'nested', parentEl: child, nestedEl: nestedGroup, includeParent });
        } else {
          slots.push({ type: 'item', el: child });
        }
      });

      // Initial hidden state
      slots.forEach(slot => {
        if (slot.type === 'item') {
          // If the element itself is a nested group, force group distance (prevents it from using its own data-distance)
          const isNestedSelf = slot.el.matches('[data-reveal-group-nested]');
          const d = isNestedSelf ? groupDistance : (slot.el.getAttribute('data-distance') || groupDistance);
          gsap.set(slot.el, { y: d, autoAlpha: 0 });
        } else {
          // Parent follows the group's distance when included, regardless of nested's data-distance
          if (slot.includeParent) gsap.set(slot.parentEl, { y: groupDistance, autoAlpha: 0 });
          // Children use nested group's own distance (fallback to group distance)
          const nestedD = slot.nestedEl.getAttribute('data-distance') || groupDistance;
          Array.from(slot.nestedEl.children).forEach(target => gsap.set(target, { y: nestedD, autoAlpha: 0 }));
        }
      });

      // Extra safety: if a nested parent is included, re-assert its distance to the group's value
      slots.forEach(slot => {
        if (slot.type === 'nested' && slot.includeParent) {
          gsap.set(slot.parentEl, { y: groupDistance }); 
        }
      });

      // Reveal sequence
      ScrollTrigger.create({
        trigger: groupEl,
        start: triggerStart,
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();

          slots.forEach((slot, slotIndex) => {
            const slotTime = slotIndex * groupStaggerSec;

            if (slot.type === 'item') {
              tl.to(slot.el, { 
                y: 0, 
                autoAlpha: 1, 
                duration: animDuration, 
                ease: animEase,
                onComplete: () => gsap.set(slot.el, { clearProps: 'all' })
              }, slotTime);
            } else {
              // Optionally include the parent at the same slot time (parent uses group distance)
              if (slot.includeParent) {
                tl.to(slot.parentEl, {
                  y: 0,
                  autoAlpha: 1,
                  duration: animDuration,
                  ease: animEase,
                  onComplete: () => gsap.set(slot.parentEl, { clearProps: 'all' })
                }, slotTime);
              }
              // Nested children use nested stagger (ms → sec); fallback to group stagger
              const nestedMs = parseFloat(slot.nestedEl.getAttribute('data-stagger'));
              const nestedStaggerSec = isNaN(nestedMs) ? groupStaggerSec : nestedMs / 1000;
              Array.from(slot.nestedEl.children).forEach((nestedChild, nestedIndex) => {
                tl.to(nestedChild, { 
                  y: 0, 
                  autoAlpha: 1, 
                  duration: animDuration, 
                  ease: animEase,
                  onComplete: () => gsap.set(nestedChild, { clearProps: 'all' })
                }, slotTime + nestedIndex * nestedStaggerSec);
              });
            }
          });
        }
      });
    });

  });

  return () => ctx.revert();
}

initContentRevealScroll();

/* Hero Marquee */
function initMarqueeScrollDirection() {
  document.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((marquee) => {
    // Query marquee elements
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    // Get data attributes
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // GSAP animation for marquee content
    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100, // Move completely out of view
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize marquee in the correct direction
    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial marquee status
    marquee.setAttribute('data-marquee-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;

        // Update animation direction and marquee status
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
  });
}

initMarqueeScrollDirection();


/* Directional List Hover Effect */
function initDirectionalListHover() {

  const directionMap = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  };

  document.querySelectorAll('[data-directional-hover]').forEach(container => {
    const type = container.getAttribute('data-type') || 'all';

    container.querySelectorAll('[data-directional-hover-item]').forEach(item => {
      const tile = item.querySelector('[data-directional-hover-tile]');
      if (!tile) return;

      item.addEventListener('mouseenter', e => {
        const dir = getDirection(e, item, type);
        tile.style.transition = 'none';
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
        void tile.offsetHeight;
        tile.style.transition = '';
        tile.style.transform = 'translate(0%, 0%)';
        item.setAttribute('data-status', `enter-${dir}`);
      });

      item.addEventListener('mouseleave', e => {
        const dir = getDirection(e, item, type);
        item.setAttribute('data-status', `leave-${dir}`);
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
      });
    });

    function getDirection(event, el, type) {
      const { left, top, width: w, height: h } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;

      if (type === 'y') return y < h / 2 ? 'top' : 'bottom';
      if (type === 'x') return x < w / 2 ? 'left' : 'right';

      const distances = {
        top: y,
        right: w - x,
        bottom: h - y,
        left: x
      };

      return Object.entries(distances).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    }
  });
}

initDirectionalListHover();

function initPreviewFollower() {
  // Find every follower wrap
  const wrappers = document.querySelectorAll('[data-follower-wrap]');

  wrappers.forEach(wrap => {
    const collection = wrap.querySelector('[data-follower-collection]');
    const items = wrap.querySelectorAll('[data-follower-item]');
    const follower = wrap.querySelector('[data-follower-cursor]');
    const followerInner = wrap.querySelector('[data-follower-cursor-inner]');

    let prevIndex = null;
    let firstEntry = true;

    const offset = 100; // The animation distance in %
    const duration = 0.5; // The animation duration of all visual transforms
    const ease = 'power2.inOut';

    // Initialize follower position
    gsap.set(follower, { xPercent: -50, yPercent: -50 });

    // Quick setters for x/y
    const xTo = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });

    // Move all followers on mousemove
    window.addEventListener('mousemove', e => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    // Enter/leave per item within this wrap
    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        const forward = prevIndex === null || index > prevIndex;
        prevIndex = index;

        // animate out existing visuals
        follower.querySelectorAll('[data-follower-visual]').forEach(el => {
          gsap.killTweensOf(el);
          gsap.to(el, {
            yPercent: forward ? -offset : offset,
            duration,
            ease,
            overwrite: 'auto',
            onComplete: () => el.remove()
          });
        });

        // clone & insert new visual
        const visual = item.querySelector('[data-follower-visual]');
        if (!visual) return;
        const clone = visual.cloneNode(true);
        followerInner.appendChild(clone);

        // animate it in (unless it's the very first entry)
        if (!firstEntry) {
          gsap.fromTo(clone,
            { yPercent: forward ? offset : -offset },
            { yPercent: 0, duration, ease, overwrite: 'auto' }
          );
        } else {
          firstEntry = false;
        }
      });

      item.addEventListener('mouseleave', () => {
        const el = follower.querySelector('[data-follower-visual]');
        if (!el) return;
        gsap.killTweensOf(el);
        gsap.to(el, {
          yPercent: -offset,
          duration,
          ease,
          overwrite: 'auto',
          onComplete: () => el.remove()
        });
      });
    });

    // If pointer leaves the collection, clear any visuals
    collection.addEventListener('mouseleave', () => {
      follower.querySelectorAll('[data-follower-visual]').forEach(el => {
        gsap.killTweensOf(el);
        gsap.delayedCall(duration, () => el.remove());
      });
      firstEntry = true;
      prevIndex = null;
    });
  });
}

initPreviewFollower();

/* Studio Image Scale */
function studioGalleryScroll() {
  
  gsap.from(".studio-gallery-list", {
    xPercent: 50,
    duration: 2,
    ease: "expo.out",
    scrollTrigger: {
      trigger: ".studio-gallery",
      start: "top 60%",
      end: "top 60%",
      toggleActions: "play none none reverse"
    }
  });

  gsap.to("[img-scale]", {
    height: "100vh",
    width: "100vw",
    ease: "none",
    scrollTrigger: {
      trigger: ".studio-gallery",
      start: "top top",
      end: "center top", 
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      refreshPriority: 1,
    }
  });
}

studioGalleryScroll();


/* Highlight Text on Scroll */
function initHighlightText(){

  let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]")
  splitHeadingTargets.forEach((heading) => {
    
    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top center"
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "bottom 20%"
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.35
    const staggerValue =  heading.getAttribute("data-highlight-stagger") || 0.1
    
    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading, 
              start: scrollStart,
              end: scrollEnd,
            }
          })
          tl.from(self.chars,{
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          })
        });
        return ctx; // return our animations so GSAP can clean them up when onSplit fires
      }
    });    
  });
}

initHighlightText();

/* Industries Color Change */
function industriesScroll() {

  gsap.from(".industries-item", {
    xPercent: 200,
    scale: 0.5,
    duration: 1.5,
    ease: "expo.out",
    stagger: 0.06,
    scrollTrigger: {
      trigger: ".industries-container",
      start: "top 60%",
      end: "top 60%",
      toggleActions: "play none none reverse",
    }
  });


  gsap.utils.toArray(".industries-item").forEach((item) => {
    gsap.to(item, {
      color: "#E24431",
      opacity: 1,
      duration: 0.1,
      scrollTrigger: {
        trigger: item,
        start: "top 40%",
        end: "bottom 40%",
        toggleActions: "play reverse play reverse",
      }
    });
  });
}

industriesScroll();


/* Expertise Scroll */
function expertiseWorkScroll() {
    const root = document.querySelector('.expertise-work')
    const pinHeight = root.querySelector('.expertise-work-height')
    const container = root.querySelector('.expertise-work-container')

    ScrollTrigger.create({
        trigger: pinHeight,
        start:'top top',
        end:'bottom bottom',
        pin: container, 
    })

    let gap = 40
    const medias = root.querySelectorAll('.expertise-work-item')
    const distPerMedia = (pinHeight.clientHeight - window.innerHeight) / medias.length

    
    gsap.set(medias, {
        y: gap * (medias.length - 1),
        z: -gap * (medias.length -1)
    })
    
    medias.forEach((media, index) => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: pinHeight, // Listen to pin-height position
                start: 'top top+=' + (distPerMedia * index),
                end: 'bottom bottom+=' + (distPerMedia * index),
                scrub: true,
                
            }
        })

        for(let i = 0; i < medias.length - 1; i++){
            tl.to(media, {
                // Gains one position in the deck queue
                y: "-=" + gap,
                z: "+=" + gap,
                ease:'power1.inOut'
            })
        }
        
        tl.to(media, {
            yPercent: -100, // Moves up by 80% of its height
            y: '-50vh', // Moves up to half the screen
            scale: 0.8,
            rotation: (Math.random() - 0.5) * 50, // Will be different for each media
            ease:'power1.inOut'
        })
    })
  }

  expertiseWorkScroll();

  function initImageTrail(config = {}) {

  // config + defaults
  const options = {
    minWidth: config.minWidth ?? 992,
    moveDistance: config.moveDistance ?? 15,
    stopDuration: config.stopDuration ?? 300,
    trailLength: config.trailLength ?? 5
  };

  const wrapper = document.querySelector('[data-trail="wrapper"]');
  
  if (!wrapper || window.innerWidth < options.minWidth) {
    return;
  }
  
  // State management
  const state = {
    trailInterval: null,
    globalIndex: 0,
    last: { x: 0, y: 0 },
    trailImageTimestamps: new Map(),
    trailImages: Array.from(document.querySelectorAll('[data-trail="item"]')),
    isActive: false
  };

  // Utility functions
  const MathUtils = {
    lerp: (a, b, n) => (1 - n) * a + n * b,
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
  };

  function getRelativeCoordinates(e, rect) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function activate(trailImage, x, y) {
    if (!trailImage) return;

    const rect = trailImage.getBoundingClientRect();
    const styles = {
      left: `${x - rect.width / 2}px`,
      top: `${y - rect.height / 2}px`,
      zIndex: state.globalIndex,
      display: 'block'
    };

    Object.assign(trailImage.style, styles);
    state.trailImageTimestamps.set(trailImage, Date.now());

	// Here, animate how the images will appear!
    gsap.fromTo(
      trailImage,
      { autoAlpha: 0, scale: 0.8 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.2,
        overwrite: true
      }
    );

    state.last = { x, y };
  }

  function fadeOutTrailImage(trailImage) {
    if (!trailImage) return;
		
    // Here, animate how the images will disappear!
    gsap.to(trailImage, {
      opacity: 0,
      scale: 0.2,
      duration: 0.8,
      ease: "expo.out",
      onComplete: () => {
        gsap.set(trailImage, { autoAlpha: 0 });
      }
    });
  }

  function handleOnMove(e) {
    if (!state.isActive) return;

    const rectWrapper = wrapper.getBoundingClientRect();
    const { x: relativeX, y: relativeY } = getRelativeCoordinates(e, rectWrapper);
    
    const distanceFromLast = MathUtils.distance(
      relativeX, 
      relativeY, 
      state.last.x, 
      state.last.y
    );

    if (distanceFromLast > window.innerWidth / options.moveDistance) {
      const lead = state.trailImages[state.globalIndex % state.trailImages.length];
      const tail = state.trailImages[(state.globalIndex - options.trailLength) % state.trailImages.length];

      activate(lead, relativeX, relativeY);
      fadeOutTrailImage(tail);
      state.globalIndex++;
    }
  }

  function cleanupTrailImages() {
    const currentTime = Date.now();
    for (const [trailImage, timestamp] of state.trailImageTimestamps.entries()) {
      if (currentTime - timestamp > options.stopDuration) {
        fadeOutTrailImage(trailImage);
        state.trailImageTimestamps.delete(trailImage);
      }
    }
  }

  function startTrail() {
    if (state.isActive) return;
    
    state.isActive = true;
    wrapper.addEventListener("mousemove", handleOnMove);
    state.trailInterval = setInterval(cleanupTrailImages, 100);
  }

  function stopTrail() {
    if (!state.isActive) return;
    
    state.isActive = false;
    wrapper.removeEventListener("mousemove", handleOnMove);
    clearInterval(state.trailInterval);
    state.trailInterval = null;
    
    // Clean up remaining trail images
    state.trailImages.forEach(fadeOutTrailImage);
    state.trailImageTimestamps.clear();
  }

  // Initialize ScrollTrigger
  ScrollTrigger.create({
    trigger: wrapper,
    start: "top bottom",
    end: "bottom top",
    onEnter: startTrail,
    onEnterBack: startTrail,
    onLeave: stopTrail,
    onLeaveBack: stopTrail
  });

  // Clean up on window resize
  const handleResize = () => {
    if (window.innerWidth < options.minWidth && state.isActive) {
      stopTrail();
    } else if (window.innerWidth >= options.minWidth && !state.isActive) {
      startTrail();
    }
  };

  window.addEventListener('resize', handleResize);

  return () => {
    stopTrail();
    window.removeEventListener('resize', handleResize);
  };
}

  const imageTrail = initImageTrail({
    minWidth: 992,
    moveDistance: 30,
    stopDuration: 1250,
    trailLength: 4
  });
