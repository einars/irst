'use strict';

function Irst() {

  var self = this;

  this.blocked_users = {};
  this.initialized = false;


  this.init = function () {
    chrome.storage.sync.get('irst.blocked-users', function (items) {
      self.initialized = true;
      self.blocked_users = items['irst.blocked-users'] || {};
      console.log(items);
      console.log(self.blocked_users);
      self.update_page();
    });
  };

  this.block_user = function (id, last_known_name) {
    if (self.initialized) {

      if ( ! confirm('Ignorēt lietotāju ' + last_known_name + '?')) {
        return;
      }

      console.log('blocking ' + id + ' / ' + last_known_name);
      self.blocked_users[id] = last_known_name;
      chrome.storage.sync.set({'irst.blocked-users': self.blocked_users});
      self.update_page();
    } else {
      alert('Nevaru bloķēt, jo neizdevās ielādēt lietotāju sarakstu.');
    }
  };

  this.unblock_user = function (id) {
    if (self.initialized) {
      if (self.blocked_users[id] === undefined) {
        alert('Nevaru atbloķēt lietotāju ' + id + ', viņš nav bloķēts.');
        return;
      }
      if ( ! confirm('Attēlot lietotāja ' + self.blocked_users[id] + ' tekstus?')) {
        return;
      }
      delete self.blocked_users[id];
      chrome.storage.sync.set({'irst.blocked-users': self.blocked_users});
      self.update_page();
    } else {
      alert('Nevaru atbloķēt, jo neizdevās ielādēt lietotāju sarakstu.');
    }
  };


  this.update_page = function () {

    var crap_removed = 0;

    $('.opinion').each(function () {

      var $op = $(this);

      if ( ! $op.attr('irst-initialized')) {
        self.wrap_comment($op);
      }

      var is_hidden = $op.attr('irst-hidden') === 'true',
          author_id = $op.attr('irst-author-id'),
          action, $crap;

      if (self.blocked_users[author_id] !== undefined && ! is_hidden) {
        action = 'hide';
      }
      if (self.blocked_users[author_id] === undefined && is_hidden) {
        action = 'show';
      }
      if (action) {
        // $crap = $op.find('.text, .avatar, .actions');
        $crap = $op;
        if (action === 'hide') {
          crap_removed += 1;
          $crap.hide();
          $op.attr('irst-hidden', 'true');
        } else {
          $crap.show();
          $op.attr('irst-hidden', 'false');
        }
      }
    });

    var $irst = $('<div/>').addClass('irst-info').append('<h4 class="irst-title">Irst!</h4>');

    var $blocked = $('<div/>').addClass('irst-blocked-users'),
        n_blocked = 0,
        k;
    for(k in self.blocked_users) {
      n_blocked += 1;
      var $a = $('<a/>').attr('href', '#').attr('irst-id', k).addClass('irst-blocked-user')
        .html(self.blocked_users[k] + '<span>×</span>').click(function (ev) {
        ev.preventDefault();
        self.unblock_user($(this).attr('irst-id'));
      });
      $blocked.append($a);
    }
    if (n_blocked) {
      $irst.append('<h4>Ignorētie lietotāji</h4>');
      $irst.append($blocked);
    }

    if (crap_removed) {
      var text = 'Aizvākti ' + crap_removed + ' komentāri.';
      if (crap_removed % 10 === 1 && crap_removed % 100 !== 11) {
        text = 'Aizvākts ' + crap_removed + ' komentārs.';
      }
      $irst.append('<p class="irst-crap-removed">' + text + '</p>');
    }

    $('.irst-info').remove();
    $('#opinions_list').after($irst);
  };

  this.wrap_comment = function ($c) {
    var author_href = $c.find('.text a:first').attr('href'),
        author_parts = author_href.split('/'),
        author_id = author_parts[2],
        author_name = $c.find('span.author:first').html(),
        $block_btn = $('<a/>').attr('href', '#');
    $c.attr('irst-initialized', 'true');
    $c.attr('irst-author-id', author_id);
    $c.attr('irst-hidden', 'false');
    $c.find('.actions span.time').before($block_btn);
    $block_btn.html('Ignorēt ' + author_name).addClass('irst-block').click(function (ev) {
      ev.preventDefault();
      self.block_user(author_id, author_name);
    });
  };

  return this;
}


(new Irst()).init();

