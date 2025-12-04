import React from 'react'
import './ErrorBoundary.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // 更新 state 以便下一次渲染将显示回退 UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 你也可以将错误日志上报给一个错误报告服务
    console.error("捕获到错误: ", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // 你可以渲染任何自定义的备用 UI
      return (
        <div className="error-boundary-fallback">
          <h2>啊哦，出错了！</h2>
          <p>似乎在应用程序中发生了意外错误。</p>
          <p>请尝试刷新页面。如果问题仍然存在，请联系支持人员。</p>
          {this.props.showDetails && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          )}
          <button className="refresh-button" onClick={() => window.location.reload()}>刷新页面</button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary