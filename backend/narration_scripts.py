"""
Chinese narration scripts for each video tutorial.
Each script is timed to match the Playwright recording actions.
Segments have text + approximate duration to sync with video.
"""

NARRATION_SCRIPTS = {
    "pos_tutorial": {
        "title": "POS 收银操作教程",
        "segments": [
            {"text": "欢迎使用Sellox收银系统，现在演示POS收银操作流程。", "pause": 2.0},
            {"text": "首先登录系统，输入账号密码后点击登录。", "pause": 2.0},
            {"text": "登录成功，进入POS收银界面。", "pause": 2.0},
            {"text": "选择门店并开始当班，输入初始现金金额。", "pause": 2.0},
            {"text": "在搜索框中输入商品名称进行搜索。", "pause": 2.0},
            {"text": "点击商品添加到购物车，多次点击可增加数量。", "pause": 2.0},
            {"text": "按F2键快速查看库存信息。", "pause": 2.0},
            {"text": "按F9键进入结算，选择支付方式完成收款。", "pause": 2.0},
            {"text": "以上就是POS收银的基本操作。", "pause": 1.0},
        ]
    },
    "products_tutorial": {
        "title": "商品管理教程",
        "segments": [
            {"text": "欢迎使用商品管理模块。", "pause": 2.0},
            {"text": "这里可以查看所有商品列表。", "pause": 2.0},
            {"text": "上下滚动浏览商品信息。", "pause": 2.0},
            {"text": "点击添加商品按钮新建商品。", "pause": 1.5},
            {"text": "填写商品编码和名称等基本信息。", "pause": 2.0},
            {"text": "向下滚动设置价格、分类和税率。", "pause": 2.0},
            {"text": "税率支持多种选项，按商品类型选择。", "pause": 2.0},
            {"text": "以上就是商品管理的核心操作。", "pause": 1.0},
        ]
    },
    "inventory_tutorial": {
        "title": "库存管理教程",
        "segments": [
            {"text": "欢迎使用库存管理模块。", "pause": 2.0},
            {"text": "先看仓库管理，可以创建多个仓库。", "pause": 2.5},
            {"text": "进入库存页面，查看实时库存数据。", "pause": 2.5},
            {"text": "查看各商品在仓库中的数量和状态。", "pause": 2.0},
            {"text": "库存预警页面自动提醒库存不足的商品。", "pause": 2.5},
            {"text": "以上就是库存管理的主要功能。", "pause": 1.0},
        ]
    },
    "sales_tutorial": {
        "title": "销售与退款教程",
        "segments": [
            {"text": "欢迎使用销售管理模块。", "pause": 2.0},
            {"text": "这里列出了所有销售订单。", "pause": 2.5},
            {"text": "可以查看每笔订单的详细信息。", "pause": 2.0},
            {"text": "日结算页面用于每天的销售结算。", "pause": 2.5},
            {"text": "自动汇总当天销售数据，方便核对。", "pause": 2.0},
            {"text": "以上就是销售管理的核心功能。", "pause": 1.0},
        ]
    },
    "customers_tutorial": {
        "title": "客户管理教程",
        "segments": [
            {"text": "欢迎使用客户管理模块。", "pause": 2.0},
            {"text": "这里展示所有注册客户信息。", "pause": 2.5},
            {"text": "可以查看消费记录和会员等级。", "pause": 2.0},
            {"text": "支持客户分类，方便制定营销策略。", "pause": 2.0},
            {"text": "以上就是客户管理的主要功能。", "pause": 1.0},
        ]
    },
    "reports_tutorial": {
        "title": "报表与分析教程",
        "segments": [
            {"text": "欢迎使用报表与分析模块。", "pause": 2.0},
            {"text": "仪表盘展示核心经营指标图表。", "pause": 3.0},
            {"text": "包含销售趋势和热销商品排行。", "pause": 2.0},
            {"text": "税务报表页面可生成税务报告。", "pause": 2.5},
            {"text": "详细列出各税率的应税金额和税额。", "pause": 2.0},
            {"text": "利润分析展示商品利润率趋势。", "pause": 2.5},
            {"text": "以上就是报表分析的核心功能。", "pause": 1.0},
        ]
    },
    "settings_tutorial": {
        "title": "系统设置教程",
        "segments": [
            {"text": "欢迎使用系统设置模块。", "pause": 2.0},
            {"text": "这里包含所有可配置的系统选项。", "pause": 2.5},
            {"text": "包括税务、打印机和支付方式设置。", "pause": 2.0},
            {"text": "向下滚动查看更多配置选项。", "pause": 2.0},
            {"text": "员工管理页面可添加用户和设置权限。", "pause": 2.5},
            {"text": "以上就是系统设置的主要内容。", "pause": 1.0},
        ]
    },
}
