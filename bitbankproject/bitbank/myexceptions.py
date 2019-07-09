

''' 注文修正時既に約定済みの場合 '''
class AlreadyFilledOrCancelledError(Exception):
    pass


''' 注文キャンセル時 '''
class OrderCancelFailedError(Exception):
    pass

''' 注文ステータス更新エラー '''
class OrderStatusUpdateError(Exception):
    pass