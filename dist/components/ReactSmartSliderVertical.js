import _objectSpread from "@babel/runtime/helpers/objectSpread";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
import React, { Fragment } from 'react';
import styled from 'styled-components';
import { C, isMacOs, isMobile } from "../lib/utils";
import { colors } from "../lib/styles";
export class ReactSmartSliderVertical extends React.Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "state", {
      scrollContainerHeight: 0,
      deltaYOrigin: 0,
      deltaY: 0,
      thumbWidth: 0,
      thumbHeight: 0,
      trackWidth: 0,
      scrollHeight: 0
    });

    _defineProperty(this, "overflowContainerRef", React.createRef());

    _defineProperty(this, "thumbRef", React.createRef());

    _defineProperty(this, "trackRef", React.createRef());

    this.measureContainers = this.measureContainers.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseDrag = this.onMouseDrag.bind(this);
    this.onOverflowContentScroll = this.onOverflowContentScroll.bind(this);
    this.deleteMouseMoveEvent = this.deleteMouseMoveEvent.bind(this);
    this.onScrollbarClick = this.onScrollbarClick.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.measureContainers);
    window.addEventListener('mouseup', this.deleteMouseMoveEvent);
    this.measureContainers();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.measureContainers);
    window.removeEventListener('mouseup', this.deleteMouseMoveEvent);
  }

  get shouldRenderScrollbar() {
    const overflownRef = this.overflowContainerRef.current;
    const cols = this.props.numCols;

    if (!cols && overflownRef) {
      return overflownRef.clientHeight < overflownRef.scrollHeight;
    }

    return !(overflownRef && overflownRef.children.length <= cols);
  }

  get contentMargin() {
    const {
      thumbWidth,
      trackWidth
    } = this.state;
    const windowsScrollWidth = 20;
    const marginWidth = trackWidth > thumbWidth ? trackWidth : thumbWidth;
    const margin = isMacOs() ? marginWidth + windowsScrollWidth : marginWidth;
    return !isMobile() && this.shouldRenderScrollbar ? `${margin + 10}px` : '20px';
  }

  get rightOffset() {
    return this.state.thumbWidth > this.state.trackWidth ? (this.state.thumbWidth - this.state.trackWidth) / 2 : 0;
  }

  scrollContainerReducedHeight(scrollContainerHeight) {
    const {
      trackProps
    } = this.props;

    if (trackProps) {
      const scrollPadding = C.getPaddingValues(trackProps.padding, trackProps.paddingLeft, trackProps.paddingRight, trackProps.paddingTop, trackProps.paddingBottom);
      const padding = scrollPadding ? scrollPadding.top + scrollPadding.bottom : 0;
      return scrollContainerHeight - padding;
    }

    return scrollContainerHeight;
  }

  measureContainers() {
    const overflownRef = this.overflowContainerRef.current;
    const thumbRef = this.thumbRef.current;
    const trackRef = this.trackRef.current;
    const areRefsCurrent = C.all(overflownRef, thumbRef, trackRef);

    if (areRefsCurrent) {
      this.setState({
        scrollContainerHeight: this.scrollContainerReducedHeight(overflownRef.clientHeight),
        thumbWidth: thumbRef.clientWidth,
        thumbHeight: thumbRef.clientHeight,
        trackWidth: trackRef.clientWidth,
        scrollHeight: overflownRef.scrollHeight
      });
    }
  }

  onMouseDown(event) {
    event.preventDefault();
    const {
      trackProps
    } = this.props;
    const scrollPadding = trackProps ? C.getPaddingValues(trackProps.padding, trackProps.paddingLeft, trackProps.paddingRight) : null;
    const padding = scrollPadding ? scrollPadding.top : 0;

    if (this.thumbRef.current) {
      this.setState({
        deltaYOrigin: this.thumbRef.current.offsetTop,
        deltaY: event.clientY + padding
      });
    }

    window.addEventListener('mousemove', this.onMouseDrag);
  }

  onScrollbarClick({
    clientY
  }) {
    const thumbRef = this.thumbRef.current;
    const overflowRef = this.overflowContainerRef.current;
    const shouldReturn = C.all(thumbRef, overflowRef, clientY >= thumbRef.offsetTop + overflowRef.getBoundingClientRect().top, clientY <= thumbRef.offsetTop + overflowRef.getBoundingClientRect().top + thumbRef.clientHeight); // leave this function if thumb was clicked

    if (shouldReturn) {
      return null;
    }

    const maximumOffset = this.state.scrollContainerHeight - thumbRef.clientHeight;
    const ratio = (overflowRef.scrollHeight - overflowRef.clientHeight) / maximumOffset;
    const deltaY = overflowRef.getBoundingClientRect().top + thumbRef.clientHeight / 2;
    return overflowRef.scroll({
      top: ratio * (clientY - deltaY),
      left: 0,
      behavior: 'smooth'
    });
  }

  deleteMouseMoveEvent() {
    window.removeEventListener('mousemove', this.onMouseDrag);
  }

  onMouseDrag(event) {
    const {
      deltaY,
      deltaYOrigin,
      scrollContainerHeight,
      thumbHeight
    } = this.state;
    const overflowRef = this.overflowContainerRef.current;
    const thumbRef = this.thumbRef.current;
    const maximumOffset = scrollContainerHeight - thumbHeight;
    const offset = event.clientY - deltaY + deltaYOrigin;
    const isBetweenClientHeight = offset >= 0 && offset <= maximumOffset;
    const areRefsCurrent = C.all(Boolean(this.overflowContainerRef.current), Boolean(this.thumbRef.current));
    console.log(scrollContainerHeight, thumbHeight);

    if (areRefsCurrent && !isBetweenClientHeight) {
      const criticalDimension = offset > 0 ? maximumOffset : 0;
      const criticalScrollerDimensions = offset > 0 ? overflowRef.scrollHeight - overflowRef.clientHeight : 0;
      thumbRef.style.top = `${criticalDimension}px`;
      overflowRef.scroll(0, criticalScrollerDimensions);
    }

    if (areRefsCurrent && isBetweenClientHeight) {
      const ratio = (overflowRef.scrollHeight - overflowRef.clientHeight) / maximumOffset;
      overflowRef.scroll(0, ratio * offset);
      thumbRef.style.top = `${offset}px`;
    }
  }

  onOverflowContentScroll() {
    const {
      scrollContainerHeight,
      thumbHeight
    } = this.state;
    const thumbRef = this.thumbRef.current;
    const maximumOffset = scrollContainerHeight - thumbHeight;
    const overflowRef = this.overflowContainerRef.current;

    if (overflowRef && thumbRef) {
      const ratio = maximumOffset / (overflowRef.scrollHeight - overflowRef.clientHeight);
      thumbRef.style.top = `${overflowRef.scrollTop * ratio}px`;
    }
  }

  renderThumb() {
    const {
      scrollContainerHeight,
      scrollHeight
    } = this.state;
    const percentageWidth = Number((scrollContainerHeight * 100 / scrollHeight).toFixed(0));
    const height = `${percentageWidth * scrollContainerHeight / 100}px`;

    if (this.props.thumb) {
      return React.cloneElement(this.props.thumb, {
        ref: this.thumbRef,
        onMouseDown: this.onMouseDown,
        style: _objectSpread({
          top: 0,
          position: 'relative',
          cursor: 'pointer',
          right: this.rightOffset,
          boxSizing: 'border-box'
        }, this.props.thumb.props.style)
      });
    }

    return React.createElement(RectangleThumb, {
      ref: this.thumbRef,
      onMouseDown: this.onMouseDown,
      style: {
        height
      }
    });
  }

  renderScrollbar() {
    const display = !isMobile() && this.shouldRenderScrollbar;
    return React.createElement(Track, {
      ref: this.trackRef,
      onClick: this.onScrollbarClick,
      style: _objectSpread({
        color: colors.gray.mediumGray,
        right: this.rightOffset,
        display: display ? 'block' : 'none'
      }, this.props.trackProps)
    }, this.renderThumb());
  }

  renderChildren() {
    const cols = this.props.numCols;
    const spacing = this.props.spacing;
    const height = cols ? `calc((100% - ${(cols - 1) * spacing}px) / ${cols})` : 'unset';
    const padding = spacing / 2;
    const children = this.props.children;
    return React.Children.map(children, (child, index) => {
      const paddingBottom = index !== React.Children.count(children) - 1 ? `paddingBottom: ${padding}px` : undefined;
      const paddingTop = index !== 0 ? `paddingTop: ${padding}px` : undefined;
      return React.createElement(ChildrenWrapper, {
        style: {
          padding: `${padding}px 0`,
          height,
          paddingTop,
          paddingBottom,
          marginRight: this.contentMargin
        }
      }, child);
    });
  }

  render() {
    return React.createElement(Fragment, null, React.createElement(Content, {
      ref: this.overflowContainerRef,
      onScroll: this.onOverflowContentScroll,
      onLoad: this.measureContainers
    }, this.renderChildren()), this.renderScrollbar());
  }

}
export const Content = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: scroll;
    margin-right: -20px;
    -webkit-overflow-scrolling: touch;
`;
export const ChildrenWrapper = styled.div``;
export const Track = styled.div`
    position: absolute;
    display: block;
    cursor: pointer;
    right: 0;
    height: 100%;
    background-color: ${colors.gray.mediumGray};
    top: 0;
    width: 10px;
`;
export const RectangleThumb = styled.div`
    position: relative;
    background-color: ${colors.primary};
    cursor: pointer;
    width: 10px;
    height: 100%;
`;