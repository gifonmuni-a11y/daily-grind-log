export default function SystemFrame({ children, className = '', cornerColor = '#7C5CFF', size = 16, style = {} }) {
  const s = size
  const cornerStyle = {
    position: 'absolute',
    width: s,
    height: s,
    borderColor: cornerColor,
  }

  return (
    <div className={`relative ${className}`} style={style}>
      <span style={{
        ...cornerStyle,
        top: 0, left: 0,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderStyle: 'solid',
        borderRight: 'none',
        borderBottom: 'none',
      }} />
      <span style={{
        ...cornerStyle,
        top: 0, right: 0,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderStyle: 'solid',
        borderLeft: 'none',
        borderBottom: 'none',
      }} />
      <span style={{
        ...cornerStyle,
        bottom: 0, left: 0,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderStyle: 'solid',
        borderRight: 'none',
        borderTop: 'none',
      }} />
      <span style={{
        ...cornerStyle,
        bottom: 0, right: 0,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderStyle: 'solid',
        borderLeft: 'none',
        borderTop: 'none',
      }} />
      {children}
    </div>
  )
}
