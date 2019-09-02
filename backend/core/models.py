import logging
import json
from datetime import datetime, timedelta
from django import forms
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.mail import send_mail
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from unixtimestampfield.fields import UnixTimeStampField
from django.core.files.storage import FileSystemStorage
from django.db.models.signals import post_delete
from django.dispatch import receiver
import unicodedata
from django.db.models import Q
from datetime import datetime
import time
from django.template.loader import get_template
from core.coincheck.coincheck import CoinCheck
import python_bitbankcc
from django.utils import timezone
from django.template.loader import get_template
from django.conf import settings
from core.myexception import *

class ASCIIFileSystemStorage(FileSystemStorage):
    """
    Convert unicode characters in name to ASCII characters.
    """
    def get_valid_name(self, name):
        name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore')
        return super(ASCIIFileSystemStorage, self).get_valid_name(name)

class UserManager(BaseUserManager):
    """ユーザーマネージャー."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """メールアドレスでの登録を必須にする"""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """is_staff(管理サイトにログインできるか)と、is_superuer(全ての権限)をFalseに"""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """スーパーユーザーは、is_staffとis_superuserをTrueに"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)



class User(AbstractBaseUser, PermissionsMixin):
    def __str__(self):
        if self.full_name == None:
            return 'no name'
        else:
            return self.full_name
        
    email = models.EmailField(_('登録メールアドレス'), unique=True)
    email_for_notice = models.EmailField(_('通知用メールアドレス'), blank=False, null = False)
    full_name = models.CharField(_('名前'), max_length=150, blank=True, null = True)
    bb_api_key = models.CharField(_('bitbank API KEY'), max_length=255, blank=True, null = True)
    bb_api_secret_key = models.CharField(_('bitbank API SECRET KEY'), max_length=255, blank=True, null = True)
    cc_api_key = models.CharField(_('coincheck API KEY'), max_length=255, blank=True, null = True)
    cc_api_secret_key = models.CharField(_('coincheck API SECRET KEY'), max_length=255, blank=True, null = True)
    
    notify_if_filled = models.BooleanField(
        verbose_name = _('約定通知'),
        default = True
    )
    use_alert = models.BooleanField(
        verbose_name = _('アラートメール通知'),
        default = True
    )

    is_staff = models.BooleanField(
        _('管理者'),
        default=False,
        help_text=_(
            'Designates whether the user can log into this admin site.'),
    )
    is_active = models.BooleanField(
        _('利用開始'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )

    remaining_days = models.IntegerField(
        _('残日数'),
        blank = True,
        default = 0,
        validators = [
                MinValueValidator(0),
        ]
    )
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    objects = UserManager()

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('利用者')
        verbose_name_plural = _('1.利用者')

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Send an email to this user."""
        send_mail(subject, message, from_email, [self.email_for_notice], **kwargs)
 

    @property
    def username(self):
        """username属性のゲッター

        他アプリケーションが、username属性にアクセスした場合に備えて定義
        メールアドレスを返す
        """
        return self.email

logger = logging.getLogger('batch_logger')

import re
def _trim_error_msg(msg):
    return re.sub('エラーコード: [0-9]+ 内容: ',"", msg)

class Order(models.Model):
    def __str__(self):
        if self.order_id == None:
            return "-"
        else:
            return self.order_id
        
    class Meta:
        verbose_name = "取引履歴"
        verbose_name_plural = "3.取引履歴"
        
    user = models.ForeignKey(
        User,
        verbose_name = '利用者',
        on_delete = models.CASCADE
    )

    market = models.CharField(
        verbose_name = _('取引所'),
        max_length = 50,
    )
   
    pair = models.CharField(
        verbose_name = _('通貨'),
        max_length = 50,
    )

    side = models.CharField(
        verbose_name = '売/買',
        max_length = 50,
    )

    order_type = models.CharField(
        verbose_name = _('注文方法'),
        max_length = 50,
    )

    price = models.FloatField(
        verbose_name = _('注文価格'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0),
        ]
    )
    price_for_stop = models.FloatField(
        verbose_name = _('ストップ価格'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0),
        ]
    )

    trail_width = models.FloatField(
        verbose_name = 'トレール幅',
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0)
        ]
    )
    trail_price = models.FloatField(
        verbose_name = 'トレール金額',
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    start_amount = models.FloatField(
        verbose_name = _('注文数量'),
        null = True,
        validators = [
            MinValueValidator(0.0),
        ]
    )

    remaining_amount = models.FloatField(
        verbose_name = _('未約定数量'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    executed_amount = models.FloatField(
        verbose_name = _('約定済数量'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    average_price = models.FloatField(
        verbose_name = _('約定平均価格'),
        null = True,
        blank = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    status = models.CharField(
        verbose_name = _('ステータス'),
        null = True,
        max_length = 50,
    )
    error_message = models.CharField(
        verbose_name = 'エラー内容',
        max_length = 50,
        default = None,
        null = True,
        blank = True
    )
    order_id = models.CharField(
        verbose_name = _('取引ID'),
        max_length = 50,
        null = True,
        blank = True
    )

    ordered_at = UnixTimeStampField(
        verbose_name = _('注文時刻unixtime'),
        use_numeric = True,
        null = True,
        auto_now_add = False,
        auto_now = False,
        blank = True
    )

    updated_at = UnixTimeStampField(
        verbose_name = _('更新日時unixtimestamp'), 
        use_numeric = True,  
        auto_now = True,
    )
    
    @property
    def myposition(self):
        if hasattr(self, 'new_order'):
            return 'new_order'
        elif hasattr(self, 'settle_order_1'):
            return 'settle_order_1'
        elif hasattr(self, 'settle_order_2'):
            return 'settle_order_2'
        else:
            raise Exception('')

    def place(self):
        logger = logging.getLogger('api')

        prv_bitbank = python_bitbankcc.private(self.user.bb_api_key, self.user.bb_api_secret_key)
        prv_coincheck = CoinCheck(self.user.cc_api_key, self.user.cc_api_secret_key)
        
        if self.market == 'bitbank':
            try:
                ret = prv_bitbank.order(
                    self.pair, # ペア
                    self.price, # 価格
                    self.start_amount, # 注文枚数
                    self.side, # 注文サイド
                    'market' if self.order_type.find("limit") == -1 else 'limit' # 注文タイプ
                )
            except Exception as e:
                logger.error('place bitbank order: ' + str(e.args))
                self.status = Order.STATUS_FAILED_TO_ORDER
                self.error_message = _trim_error_msg(e.args[0])
                self.save()
                return False
            else:
                self.remaining_amount = ret.get('remaining_amount')
                self.executed_amount = ret.get('executed_amount')
                self.average_price = ret.get('average_price')
                self.status = ret.get('status')
                self.ordered_at = ret.get('ordered_at')
                self.order_id = ret.get('order_id')
                self.save()
                return True
           
        elif self.market == 'coincheck':
            try:
                current_rate = float(json.loads(prv_coincheck.ticker.all())['last'])
                ret = json.loads(prv_coincheck.order.create({
                    'rate': self.price if 'limit' in self.order_type else None,
                    'amount': self.start_amount if not (self.order_type == 'market' and self.side == 'buy') else None,
                    'market_buy_amount': current_rate * self.start_amount if (self.order_type == 'market' and self.side == 'buy') else None,
                    'order_type': self.side if 'limit' in self.order_type else 'market_' + self.side,
                    'pair': self.pair
                }))
            except Exception as e:
                self.status = Order.STATUS_FAILED_TO_ORDER
                self.error_message = e.args[0]
                self.save()
                raise OrderFailedError(self.error_message)
            else:
                if ret.get('success'):
                    self.order_id = ret.get('id')
                    self.remaining_amount = ret.get('amount')
                    ordered_date = datetime.strptime(ret.get('created_at'), '%Y-%m-%dT%H:%M:%S.%fZ') + timedelta(hours = 9)
                    self.ordered_at = int(ordered_date.timestamp() * 1000)
                    self.status = self.STATUS_UNFILLED
                    self.save()
                    return True
                elif ret.get('error'):
                    self.status = self.STATUS_FAILED_TO_ORDER
                    self.error_message = ret.get('error')
                    self.save()
                    raise OrderFailedError(self.error_message)
                else:
                    raise Exception('想定外のレスポンス:' + str(ret))

    def cancel(self):
        # 未約定、部分約定以外のステータスの倍はステータスのみ変更
        if self.status not in { self.STATUS_UNFILLED, self.STATUS_PARTIALLY_FILLED }:
            self.status = self.STATUS_CANCELED_UNFILLED
            self.save()
            return True
        
        prv_bitbank = python_bitbankcc.private(self.user.bb_api_key, self.user.bb_api_secret_key)
        prv_coincheck = CoinCheck(self.user.cc_api_key, self.user.cc_api_secret_key)
        
        if self.market == 'bitbank':
            try:
                ret = prv_bitbank.cancel_order(
                    self.pair, # ペア
                    self.order_id # 注文ID
                )
            except Exception as e:
                raise OrderCancelFailedError(_trim_error_msg(e.args[0]) )
            else:
                self.remaining_amount = ret.get('remaining_amount')
                self.executed_amount = ret.get('executed_amount')
                self.average_price = ret.get('average_price')
                self.status = ret.get('status')
                self.save()
                return True
            

        elif self.market == 'coincheck':
            try:
                ret = json.loads(prv_coincheck.order.cancel({
                    'id': self.order_id # 注文ID
                }))   
            except Exception as e:
                raise OrderCancelFailedError(e.args[0])
            else:
                if not ret.get('success') and ret.get('error'):
                    raise OrderCancelFailedError(ret.get('error'))
                self.status = self.STATUS_CANCELED_UNFILLED
                self.save()
                return True
                
            
    def update(self):
        logger  = logging.getLogger('api')
    
        prv_bitbank = python_bitbankcc.private(self.user.bb_api_key, self.user.bb_api_secret_key)
        prv_coincheck = CoinCheck(self.user.cc_api_key, self.user.cc_api_secret_key)
        
        if self.market == 'bitbank':
            try:
                ret = prv_bitbank.get_order(
                    self.pair, 
                    self.order_id
                )
            except Exception as e:
                raise OrderStatusUpdateError(_trim_error_msg(e.args[0]) )
            else:
                self.remaining_amount = ret.get('remaining_amount')
                self.executed_amount = ret.get('executed_amount')
                self.average_price = ret.get('average_price')
                status = ret.get('status')
                self.status = status
                self.save()
                return status
          
        elif self.market == 'coincheck':
            try:
                _open = json.loads(prv_coincheck.order.opens({}))
                _close = json.loads(prv_coincheck.order.transactions({
                    'limit': 1,
                    'starting_after': self.order_id,
                    'ending_before': self.order_id
                }))
            except Exception as e:
                raise OrderStatusUpdateError(e.args[0])
            else:
                if not _open.get('success'):
                    if _open.get('error'):
                        raise OrderStatusUpdateError(_open.get('error'))
                    raise OrderStatusUpdateError('想定外の応答: ' + str(_open))
                if not _close.get('success'):
                    if _close.get('error'):
                        raise OrderStatusUpdateError(_close.get('error'))
                    raise OrderStatusUpdateError('想定外の応答: ' + str(_close))
                
                is_open = False
                for oo in _open.get('orders'):
                    if oo.get('id') == self.order_id:
                        is_open = True
                        return self.STATUS_UNFILLED

                if not is_open:
                    if len(_close.get('transactions')) != 0:
                        # filled
                        self.status = self.STATUS_FULLY_FILLED
                        self.executed_amount = self.start_amount
                        self.remaining_amount = 0
                        self.average_price = float(_close.get('transactions')[0].get('rate'))
                    else:
                        # canceled
                        self.status = self.STATUS_CANCELED_UNFILLED
                    self.save()
                    return self.STATUS_FULLY_FILLED
    def notify_user(self):
        try:
            readable_datetime = datetime.fromtimestamp(int(int(self.ordered_at) / 1000))
        except ValueError:
            return False
        else:
            context = { "user": self.user, "order": self, 'readable_datetime': readable_datetime }
            subject = get_template('bitbank/mail_template/fill_notice/subject.txt').render(context)
            message = get_template('bitbank/mail_template/fill_notice/message.txt').render(context)
            self.user.email_user(subject, message, settings.DEFAULT_FROM_EMAIL)
            logger.info('notice sent to:' + self.user.email_for_notice)

class Relation(models.Model):
    def __str__(self):
        return self.special_order

    class Meta:
        verbose_name = "発注一覧"
        verbose_name_plural = "2.発注一覧"

    ORDER_SINGLE = 'SINGLE'
    ORDER_IFD = 'IFD'
    ORDER_OCO = 'OCO'
    ORDER_IFDOCO = 'IFDOCO'

    MARKET = [
        'bitbank',
        'coincheck'
    ]
    PAIR = [
        'btc_jpy',
        'xrp_jpy',
        'ltc_btc',
        'eth_btc',
        'mona_jpy',
        'mona_btc',
        'bcc_jpy',
        'bcc_btc',
    ]
    SPECIAL_ORDER = [
        'SINGLE',
        # 'IFD',
        # 'OCO',
        # 'IFDOCO'  
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    market = models.CharField(
        verbose_name = _('取引所'),
        max_length = 50,
        default = 'bitbank'
    )
    
    pair = models.CharField(
        verbose_name = _('通貨'),
        max_length = 50,
    )
    
    special_order = models.CharField(
        verbose_name = _('特殊注文'), 
        max_length = 50,
    )

    order_1 = models.OneToOneField(
        Order,
        verbose_name = '新規注文',
        related_name = 'new_order',
        null = True,
        blank = True,
        on_delete = models.CASCADE
    )
    order_2 = models.OneToOneField(
        Order,
        verbose_name = '決済注文1',
        related_name = 'settle_order_1',
        null = True,
        blank = True,
        on_delete = models.CASCADE
    )
    order_3 = models.OneToOneField(
        Order,
        verbose_name = '決済注文2',
        related_name = 'settle_order_2',
        null = True,
        blank = True,
        on_delete = models.CASCADE
    )
    placed_at = models.DateTimeField(
        verbose_name = '注文日時',
        auto_now_add = True
    )
    is_locked = models.BooleanField(
        verbose_name = 'ロック中',
        default = False
    )
    is_active = models.BooleanField(
        verbose_name = '有効',
        default = True,
    )
    
   

class Alert(models.Model):
    def __str__(self):
        return self.pair

    class Meta:
        verbose_name = "通知設定"
        verbose_name_plural = "4.通知設定"
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    market = models.CharField(
        verbose_name = '取引所',
        max_length = 50,
        default = 'bitbank'
    )
    pair = models.CharField(
        verbose_name = _('通貨'),
        max_length = 50,
        default = 'btc_jpy',
    )

    rate = models.FloatField(
        verbose_name = _('通知レート'),
        null = False,
        validators = [
            MinValueValidator(0),
        ]
    )

    over_or_under = models.CharField(
        verbose_name = _('上下'),
        max_length = 50,
        null = False,
    )

    alerted_at = models.DateTimeField(
        verbose_name = _('通知日時'),   
        auto_now = False,
        null = True
    )
    comment = models.CharField(
        verbose_name = 'コメント',
        max_length = 255,
        blank = True,
        default = ""
    )

    is_active = models.BooleanField(
        verbose_name = _('有効'),
        null = True,
    )
    def notify_user(self):
        if self.user.use_alert == 'ON':
            context = { "user": self.user, "rate": self.rate, "pair": self.pair, "comment": self.comment }
            subject = get_template('bitbank/mail_template/rate_notice/subject.txt').render(context)
            message = get_template('bitbank/mail_template/rate_notice/message.txt').render(context)
            self.user.email_user(subject, message, settings.DEFAULT_FROM_EMAIL)
            self.alerted_at = timezone.now()
            
        self.is_active = False
        self.save()
    
        
class Attachment(models.Model):
    def __str__(self):
        return self.file.name
    class Meta:
        verbose_name = "添付ファイル"
        verbose_name_plural = "添付ファイル"
    file = models.FileField(
        verbose_name = 'ファイル',
        upload_to = 'attachments',
        null = False,
        blank = False,
    )
    uploaded_at = models.DateTimeField(
        verbose_name = 'アップロード日時',
        auto_now_add = True,
    )

class Inquiry(models.Model):
    def __str__(self):
        return self.subject
    class Meta:
        verbose_name = "問い合せ"
        verbose_name_plural = "5.問い合せ"

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    subject = models.CharField(
        verbose_name = _('件名'),
        max_length = 255,
    )
    body = models.CharField(
        verbose_name = _('内容'),
        max_length = 255,
    )
    email_for_reply = models.EmailField(
        verbose_name = _('通知用メールアドレス'),
    )
    attachment_1 = models.ForeignKey(
        Attachment,
        verbose_name = '添付ファイル1',
        null = True,
        blank = True,
        on_delete = models.CASCADE,
        related_name = 'att_1'
    )
    attachment_2 = models.ForeignKey(
        Attachment,
        verbose_name = '添付ファイル2',
        null = True,
        blank = True, 
        on_delete = models.CASCADE,
        related_name = 'att_2'
    )
    attachment_3 = models.ForeignKey(
        Attachment,
        verbose_name = '添付ファイル3',
        null = True,
        blank = True,
        on_delete = models.CASCADE,
        related_name = 'att_3'
    )

    closed = models.BooleanField(
        _('解決済'),
        default=False,
    )
    date_initiated = models.DateTimeField(
        verbose_name = '問い合せ日時',
        auto_now_add = True,

    )


class BankInfo(models.Model):
    def __str__(self):
        return '口座情報'
    class Meta:
        verbose_name = "口座情報"
        verbose_name_plural = "6.口座情報"
    
    types = [
        ('普通', '普通'),
        ('当座', '当座')
    ]
    bank = models.CharField(
        verbose_name = '金融機関名',
        max_length = 20,
        default = 'xxx銀行',
        blank = False,
        null = False
    )
    branch = models.CharField(
        verbose_name = '支店名',
        max_length = 20,
        default = 'xxx支店',
        blank = False,
        null = False
    )
    meigi = models.CharField(
        verbose_name = '口座名義人',
        max_length = 50,
        default = 'xxxxx'
    )
    type = models.CharField(
        verbose_name = '口座種別',
        max_length = 20,
        choices = types,
        default = '普通'
    )
    number = models.CharField(
        verbose_name = '口座番号',
        max_length = 20,
        default = '00000',
        null = False,
        blank = False
    )


    @staticmethod
    def get_bank_info():
        qs = BankInfo.objects.all()
        if len(qs) == 0:
            instance = BankInfo()
            BankInfo.bank = 'no data'
            BankInfo.branch = 'no data'
            BankInfo.meigi = 'no data'
            BankInfo.type = '普通'
            BankInfo.number = 'no data'
            return instance
        return qs[0]

@receiver(post_delete, sender=Attachment)
def delete_file(sender, instance, **kwargs):
    instance.file.delete(False)
