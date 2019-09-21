from core.models import *
from django.shortcuts import get_object_or_404
from core.enums import *
import json, math
from django.http import Http404, HttpResponseBadRequest, JsonResponse
import ccxt
from django.contrib.sites.shortcuts import get_current_site
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.views import generic

class SignUpCompleteView(generic.TemplateView):
    template_name = 'user_create_complete.html'
    
    def get(self, request, **kwargs):
        """tokenが正しければ本登録."""
        token = kwargs.get('token')
        try:
            user_pk = loads(token, max_age=60*60*24)
        # 期限切れ
        except SignatureExpired:
            return HttpResponseBadRequest()
        # tokenが間違っている
        except BadSignature:
            return HttpResponseBadRequest()
        # tokenは問題なし
        else:
            try:
                user = User.objects.get(pk=user_pk)
            except User.DoesNotExist:
                return HttpResponseBadRequest()
            else:
                if not user.is_active:
                    # 問題なければ本登録とする
                    user.is_active = True
                    user.save()
                    return super().get(request, **kwargs)
                else:
                    print('このユーザはすでにアクティブです')
        return HttpResponseBadRequest()

